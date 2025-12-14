import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import grangercausalitytests
from tqdm import tqdm


class GrangerModule:
    def __init__(self, analyzer_instance):
        self.parent = analyzer_instance
        self.df_diff = analyzer_instance.df_diff
        self.cfg = analyzer_instance.cfg
        self.results_df = None

    def run_analysis(self):
        print("--- [Moduł Granger] Analiza Przyczynowości ---")

        composer_id = self.cfg["COMPOSER_ID"]

        if composer_id not in self.df_diff.columns:
            print(f"BŁĄD: Brak ID kompozytora '{composer_id}'")
            return {}

        maxlag = int(self.cfg["GRANGER_MAX_LAG_SEC"] * self.cfg["SAMPLING_RATE_HZ"])
        p_threshold = self.cfg["GRANGER_P_VALUE_THRESHOLD"]
        listeners = [c for c in self.df_diff.columns if c != composer_id]

        stats_data = []
        causal_map = {}

        print(f"   Parametry: Max Lag={maxlag} próbek, P-val < {p_threshold}")

        for listener in tqdm(listeners, desc="   Analiza Granger", unit="listener"):
            if self.df_diff[listener].std() < 1e-6:
                stats_data.append(
                    self._create_record(listener, False, "Flat Signal", 0, 1.0, 0.0)
                )
                continue

            data_pair = self.df_diff[[listener, composer_id]]
            try:
                gc_res = grangercausalitytests(data_pair, maxlag=maxlag, verbose=False)

                best_lag = None
                max_f_stat = -1.0
                best_p_val = 1.0

                for lag, result in gc_res.items():
                    stats = result[0]["ssr_ftest"]
                    if stats[1] < p_threshold:
                        if stats[0] > max_f_stat:
                            max_f_stat = stats[0]
                            best_p_val = stats[1]
                            best_lag = lag

                if best_lag is not None:
                    causal_map[listener] = best_lag
                    stats_data.append(
                        self._create_record(
                            listener,
                            True,
                            "Significant",
                            best_lag,
                            best_p_val,
                            max_f_stat,
                        )
                    )
                else:
                    stats_data.append(
                        self._create_record(
                            listener, False, "No Causality", 0, 1.0, 0.0
                        )
                    )

            except Exception as e:
                stats_data.append(
                    self._create_record(
                        listener, False, f"Error: {str(e)}", 0, 1.0, 0.0
                    )
                )

        self.results_df = pd.DataFrame(stats_data)
        if not self.results_df.empty:
            self.results_df = self.results_df.sort_values(
                by=["is_causal", "f_stat"], ascending=[False, False]
            )

        self.parent.causal_listeners_lags = causal_map
        print(f"   -> Zakończono. Spójni: {len(causal_map)} / {len(listeners)}")
        return causal_map

    def export_results(self):
        """Zapisuje wyniki używając funkcji z klasy bazowej."""
        if self.results_df is None or self.results_df.empty:
            return

        # UŻYCIE NOWEJ FUNKCJI Z BASE
        # Wygeneruje: analysis_results/NAZWA_PROJEKTU/01_granger_causality.csv
        file_path = self.parent.get_output_path(
            base_name="granger_causality", prefix="01_", extension=".csv"
        )

        self.results_df.to_csv(file_path, index=False)
        print(f"   -> Wyniki zapisano: {file_path}")
    
    def export_graph(self):
        """
        Generuje wykres prezentujący:
        - Kompozytora (czerwona linia)
        - Średnią odpowiedź uczestników przyczynowych (niebieska linia)
        - Zakres odpowiedzi przyczynowych (zielony obszar)
        """
        if not self.parent.causal_listeners_lags:
            print("   (!) Brak danych przyczynowych do wykresu.")
            return
        
        print("   Generowanie wykresu przyczynowości Grangera...")
        
        composer_id = self.cfg["COMPOSER_ID"]
        causal_ids = list(self.parent.causal_listeners_lags.keys())
        
        # Używamy danych standaryzowanych (Z-Score) ponieważ analiza była na Z-Score
        df_pivot = self.parent.df_pivot
        time_seconds = self.parent.get_time_axis_seconds(df_pivot.index)
        
        # Dane kompozytora
        composer_data = df_pivot[composer_id]
        
        # Dane uczestników przyczynowych
        causal_data = df_pivot[causal_ids]
        causal_mean = causal_data.mean(axis=1)
        causal_min = causal_data.min(axis=1)
        causal_max = causal_data.max(axis=1)
        
        # Tworzenie wykresu
        fig, ax = plt.subplots(figsize=(16, 8))
        
        # Zielony obszar zakresu
        ax.fill_between(time_seconds, causal_min, causal_max, 
                        color='green', alpha=0.2, 
                        label=f'Zakres odpowiedzi przyczynowych (n={len(causal_ids)})')
        
        # Średnia przyczynowych
        ax.plot(time_seconds, causal_mean, 
               color='blue', linewidth=2, alpha=0.8,
               label='Średnia uczestników z przyczynowością')
        
        # Kompozytor
        comp_label = self.parent.get_record_label(composer_id)
        ax.plot(time_seconds, composer_data, 
               color='red', linewidth=2.5, alpha=0.9,
               label=f'KOMPOZYTOR: {comp_label}', zorder=10)
        
        # Konfiguracja osi
        self.parent.setup_time_axis(ax, df_pivot.index)
        ax.set_ylabel("Wynik standaryzowany (Z-Score)", fontsize=11)
        ax.set_title(
            f"Przyczynowość w sensie Grangera\n{self.cfg.get('NAME', '')}\n"
            f"Uczestnicy przyczynowi: {len(causal_ids)} / {len(df_pivot.columns)-1}",
            fontsize=13, fontweight='bold'
        )
        ax.legend(loc='upper right', fontsize=10)
        ax.grid(True, alpha=0.3)
        
        # Zapis
        img_path = self.parent.get_output_path(
            base_name="granger_causality_visual", prefix="01_", extension=".png"
        )
        plt.tight_layout()
        plt.savefig(img_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"   -> Wykres przyczynowości zapisany: {img_path}")

    def _create_record(self, lid, is_c, reason, lag, p, f):
        return {
            "listener_id": self.parent.get_record_label(lid),
            "is_causal": is_c,
            "reason": reason,
            "best_lag_samples": lag,
            "best_lag_sec": lag / self.cfg["SAMPLING_RATE_HZ"],
            "p_value": round(p, 6),
            "f_stat": round(f, 2),
        }
