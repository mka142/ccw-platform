import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import warnings
from tqdm import tqdm


class NarrativeModule:
    def __init__(self, analyzer_instance):
        """
        Moduł odpowiedzialny za badanie Spójności Narracyjnej.
        """
        self.parent = analyzer_instance
        self.cfg = analyzer_instance.cfg
        self.df_pivot = analyzer_instance.df_pivot  # Dane Z-Score
        self.lags = analyzer_instance.causal_listeners_lags
        self.results_df = None

    def run_analysis(self):
        print("--- [Moduł Narrative] Analiza Spójności (Rolling) ---")

        if not self.lags:
            print("   (!) Brak danych z Grangera. Pomijam.")
            return None

        composer_id = self.cfg["COMPOSER_ID"]
        window_size = int(self.cfg["WINDOW_SECONDS"] * self.cfg["SAMPLING_RATE_HZ"])
        composer_series = self.df_pivot[composer_id]

        rolling_results = pd.DataFrame(index=self.df_pivot.index)

        print(f"   Przetwarzanie {len(self.lags)} słuchaczy...")

        for idx, (listener, lag_samples) in enumerate(tqdm(self.lags.items(), desc="   Rolling Spearman", unit="listener")):
            # 1. Synchronizacja
            comp_shifted = composer_series.shift(lag_samples)
            listener_series = self.df_pivot[listener]

            # 2. Rolling Spearman Correlation (Custom Implementation)
            # Pandas rolling().corr() nie obsługuje method="spearman" w starszych wersjach
            # Implementujemy własną funkcję Rolling Spearman
            
            def rolling_spearman(x, y, window):
                """Oblicza rolling Spearman correlation używając rankowania."""
                result = pd.Series(index=x.index, dtype=float)
                for i in range(window - 1, len(x)):
                    window_x = x.iloc[i - window + 1:i + 1]
                    window_y = y.iloc[i - window + 1:i + 1]
                    
                    # Usuń NaN
                    valid_mask = ~(window_x.isna() | window_y.isna())
                    valid_x = window_x[valid_mask]
                    valid_y = window_y[valid_mask]
                    
                    if len(valid_x) > 2:
                        # Spearman = Pearson na rankach
                        rank_x = valid_x.rank()
                        rank_y = valid_y.rank()
                        corr = rank_x.corr(rank_y)
                        result.iloc[i] = corr
                    else:
                        result.iloc[i] = np.nan
                
                return result
            
            rc = rolling_spearman(listener_series, comp_shifted, window_size)

            # 3. Imputacja Liniowa (dla ciągłości wykresów)
            rc = rc.interpolate(method="linear", limit_direction="both")
            rc = rc.ffill().bfill().fillna(0)

            # Use label instead of record_id if configured
            listener_label = self.parent.get_record_label(listener)
            rolling_results[listener_label] = rc

        self.results_df = rolling_results

        # Przekazanie wyników do pamięci rodzica (dla modułu Meta)
        self.parent.narrative_trajectories = rolling_results

        print(
            f"   -> Obliczono trajektorie dla {len(rolling_results.columns)} słuchaczy."
        )
        return rolling_results

    def export_results(self):
        """Zapisuje trajektorie do CSV."""
        if self.results_df is None or self.results_df.empty:
            return

        file_path = self.parent.get_output_path(
            base_name="narrative_trajectories", prefix="02_", extension=".csv"
        )

        self.results_df.to_csv(file_path, index=True)
        print(f"   -> Wyniki zapisano: {file_path}")
    
    def export_graph(self):
        """
        Generuje wykres trajektorii spójności narracyjnej:
        - Średnia wartość korelacji Spearmana w czasie
        - Kompozytor (Z-Score)
        - Średnia uczestników przyczynowych (Z-Score)
        """
        if self.results_df is None or self.results_df.empty:
            print("   (!) Brak danych trajektorii do wykresu.")
            return
        
        print("   Generowanie wykresu trajektorii Spearmana...")
        
        composer_id = self.cfg["COMPOSER_ID"]
        df_pivot = self.parent.df_pivot  # Z-Score data
        time_seconds = self.parent.get_time_axis_seconds(self.results_df.index)
        
        # Średnia korelacja Spearmana w czasie
        spearman_mean = self.results_df.mean(axis=1)
        
        # Dane Z-Score kompozytora i uczestników
        causal_ids = list(self.lags.keys())
        composer_zscore = df_pivot[composer_id]
        causal_zscore_mean = df_pivot[causal_ids].mean(axis=1)
        
        # Tworzenie wykresu z podwójną skalą Y
        fig, ax1 = plt.subplots(figsize=(16, 8))
        
        # Oś 1: Współczynnik korelacji Spearmana
        color_spearman = 'darkblue'
        ax1.set_ylabel('Współczynnik korelacji rang Spearmana', 
                      color=color_spearman, fontsize=11, fontweight='bold')
        ax1.plot(time_seconds, spearman_mean, 
                color=color_spearman, linewidth=2.5, alpha=0.9,
                label='Średnia korelacja Spearmana (przyczynowi)')
        ax1.tick_params(axis='y', labelcolor=color_spearman)
        ax1.set_ylim(-1.05, 1.05)
        ax1.axhline(y=0, color='gray', linestyle='--', alpha=0.5, linewidth=0.8)
        ax1.grid(True, alpha=0.2)
        
        # Oś 2: Z-Score odpowiedzi
        ax2 = ax1.twinx()
        color_responses = 'gray'
        ax2.set_ylabel('Wynik standaryzowany (Z-Score)', 
                      color=color_responses, fontsize=11)
        
        comp_label = self.parent.get_record_label(composer_id)
        ax2.plot(time_seconds, composer_zscore, 
                color='red', linewidth=1.8, alpha=0.6, linestyle='--',
                label=f'Kompozytor: {comp_label}')
        ax2.plot(time_seconds, causal_zscore_mean, 
                color='green', linewidth=1.8, alpha=0.6, linestyle=':',
                label=f'Średnia przyczynowych')
        ax2.tick_params(axis='y', labelcolor=color_responses)
        
        # Konfiguracja osi X
        self.parent.setup_time_axis(ax1, self.results_df.index)
        
        # Tytuł
        ax1.set_title(
            f"Trajektorie spójności napięcia\n{self.cfg.get('NAME', '')}\n"
            f"Rolling Spearman (okno: {self.cfg['WINDOW_SECONDS']}s, n={len(self.lags)})",
            fontsize=13, fontweight='bold', pad=20
        )
        
        # Legenda połączona
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax1.legend(lines1 + lines2, labels1 + labels2, 
                  loc='upper left', fontsize=10)
        
        # Zapis
        img_path = self.parent.get_output_path(
            base_name="tension_trajectories_visual", prefix="02_", extension=".png"
        )
        plt.tight_layout()
        plt.savefig(img_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"   -> Wykres trajektorii zapisany: {img_path}")
