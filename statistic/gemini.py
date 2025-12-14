import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.stattools import grangercausalitytests
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import squareform

# ==========================================
# KONFIGURACJA BADANIA
# ==========================================
CONFIG = {
    "CSV_FILE": "data/K1/csv/K1-Łabowska-global-data-2025-12-08.csv",
    "SAMPLING_RATE_HZ": 20,  # 20Hz = 50ms
    "WINDOW_SECONDS": 15,  # Okno analizy
    "COMPOSER_ID": "global:rerecord_1765194266519",
    "GRANGER_MAX_LAG_SEC": 4.0,  # Szukamy opóźnienia w zakresie 0-4s
    "GRANGER_P_VALUE_THRESHOLD": 0.05,
    "CLUSTER_THRESHOLD": 0.5,
}


class MusicalTensionAnalyzer:
    def __init__(self, config):
        self.cfg = config
        self.df_pivot = None
        self.df_diff = None
        # Słownik przechowujący słuchaczy spójnych wraz z ich indywidualnym opóźnieniem
        # Format: {'listener_id': optimal_lag_samples}
        self.causal_listeners_lags = {}
        self.non_causal_listeners = []

    def load_and_preprocess(self):
        print("--- [1/5] Wczytywanie i preprocessing danych ---")
        try:
            df = pd.read_csv(self.cfg["CSV_FILE"])
        except FileNotFoundError:
            print("(!) Generuję dane testowe...")
            df = self._generate_mock_data()

        self.df_pivot = df.pivot(index="timestamp", columns="record_id", values="value")
        self.df_pivot = self.df_pivot.interpolate(method="linear").fillna(
            method="bfill"
        )

        # Różnicowanie dla stacjonarności
        self.df_diff = self.df_pivot.diff().dropna()

    def run_granger_adaptive_filter(self):
        """
        Przeprowadza test Grangera, szukając OPTYMALNEGO opóźnienia dla każdego słuchacza.
        Kryterium: Najwyższa wartość statystyki F przy p-value < 0.05.
        """
        print("--- [2/5] Adaptacyjna Analiza Grangera (Szukanie Max F-stat) ---")
        maxlag = int(self.cfg["GRANGER_MAX_LAG_SEC"] * self.cfg["SAMPLING_RATE_HZ"])
        print(self.df_diff.head())
        listeners = [c for c in self.df_diff.columns if c != self.cfg["COMPOSER_ID"]]

        for listener in listeners:
            data_pair = self.df_diff[[listener, self.cfg["COMPOSER_ID"]]]

            try:
                # Wykonujemy test dla wszystkich lagów od 1 do maxlag
                gc_res = grangercausalitytests(data_pair, maxlag=maxlag, verbose=False)

                best_lag = None
                max_f_stat = -1

                # Przeszukujemy wyniki dla każdego lagu
                for lag, result in gc_res.items():
                    # result[0] to słownik testów. 'ssr_ftest' to test F.
                    # struktura: (F, p, df_denom, df_num)
                    f_stat = result[0]["ssr_ftest"][0]
                    p_val = result[0]["ssr_ftest"][1]

                    if p_val < self.cfg["GRANGER_P_VALUE_THRESHOLD"]:
                        if f_stat > max_f_stat:
                            max_f_stat = f_stat
                            best_lag = lag

                if best_lag is not None:
                    # Znaleziono istotny związek przyczynowy
                    self.causal_listeners_lags[listener] = best_lag
                else:
                    self.non_causal_listeners.append(listener)

            except Exception as e:
                print(f"Błąd obliczeń dla {listener}: {e}")

        print(f"Zidentyfikowano {len(self.causal_listeners_lags)} spójnych słuchaczy.")
        if self.causal_listeners_lags:
            avg_lag = np.mean(list(self.causal_listeners_lags.values()))
            print(
                f"Średnie opóźnienie reakcji w grupie: {avg_lag} próbek ({avg_lag/self.cfg['SAMPLING_RATE_HZ']:.2f} s)"
            )

    def analyze_rolling_correlation_adaptive(self):
        """
        Oblicza korelację w oknie przesuwnym, uwzględniając INDYWIDUALNE przesunięcie
        dla każdego słuchacza.
        """
        if not self.causal_listeners_lags:
            return

        print("--- [3/5] Rolling Correlation (Adaptacyjne Opóźnienie) ---")

        window_size = int(self.cfg["WINDOW_SECONDS"] * self.cfg["SAMPLING_RATE_HZ"])
        rolling_corrs = pd.DataFrame(index=self.df_diff.index)

        composer_series = self.df_diff[self.cfg["COMPOSER_ID"]]

        for listener, lag_samples in self.causal_listeners_lags.items():
            # Indywidualne dopasowanie: Przesuwamy kompozytora o lag konkretnego słuchacza
            # Shift dodatni na kompozytorze oznacza, że porównujemy Composer(t) z Listener(t+lag)
            comp_shifted = composer_series.shift(lag_samples)

            rc = self.df_diff[listener].rolling(window=window_size).corr(comp_shifted)
            rolling_corrs[listener] = rc

        self.causal_avg_corr = rolling_corrs.mean(axis=1)

        plt.figure(figsize=(12, 6))
        # Rysujemy średnią
        plt.plot(
            self.df_pivot.index,
            self.causal_avg_corr,
            color="#2ca02c",
            linewidth=2,
            label="Średnia Korelacja (Dopasowana)",
        )

        # Opcjonalnie: Rysujemy "chmurę" wszystkich korelacji, by pokazać dyspersję
        for col in rolling_corrs.columns:
            plt.plot(
                self.df_pivot.index,
                rolling_corrs[col],
                color="green",
                alpha=0.1,
                linewidth=0.5,
            )

        plt.axhline(0, color="black", linestyle="--")
        plt.title(
            f"Dynamika wpływu Kompozytora (Model Adaptacyjny)\nOptymalizacja opóźnień na podstawie testu F Grangera"
        )
        plt.ylabel("Korelacja Pearsona (Dopasowana fazowo)")
        plt.xlabel("Czas")
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.show()

    def analyze_non_causal_subgroups(self):
        # (Bez zmian względem poprzedniej wersji - analiza klastrów dla reszty)
        if len(self.non_causal_listeners) < 2:
            return

        print("--- [4/5] Analiza Podgrup Niespójnych ---")
        subset_df = self.df_diff[self.non_causal_listeners]
        corr_matrix = subset_df.corr()
        dist_matrix = np.clip(1 - corr_matrix, 0, 2)
        Z = linkage(squareform(dist_matrix), method="ward")

        plt.figure(figsize=(8, 6))
        sns.clustermap(
            corr_matrix, cmap="coolwarm", center=0, row_linkage=Z, col_linkage=Z
        )
        plt.title("Podgrupy wsród słuchaczy niespójnych z kompozytorem")
        plt.show()

    def _generate_mock_data(self):
        # Generowanie danych testowych z RÓŻNYMI opóźnieniami
        time_steps = 2000
        t = np.linspace(0, 100, time_steps)
        composer_sig = np.sin(t * 0.5) * 50 + 50

        data = []
        for i, val in enumerate(composer_sig):
            data.append(
                {"timestamp": t[i], "record_id": self.cfg["COMPOSER_ID"], "value": val}
            )

        # Słuchacze z różnym czasem reakcji
        delays = [10, 20, 30, 40, 50]  # Różne opóźnienia w próbkach
        for i, delay in enumerate(delays):
            noise = np.random.normal(0, 2, time_steps)
            listener_sig = np.roll(composer_sig, delay) + noise
            for j, val in enumerate(listener_sig):
                data.append(
                    {"timestamp": t[j], "record_id": f"listener_d{delay}", "value": val}
                )

        # Słuchacze losowi
        for i in range(3):
            rand_sig = np.random.normal(50, 10, time_steps)
            for j, val in enumerate(rand_sig):
                data.append(
                    {"timestamp": t[j], "record_id": f"random_{i}", "value": val}
                )

        return pd.DataFrame(data)


if __name__ == "__main__":
    analyzer = MusicalTensionAnalyzer(CONFIG)
    analyzer.load_and_preprocess()
    analyzer.run_granger_adaptive_filter()
    analyzer.analyze_rolling_correlation_adaptive()
    analyzer.analyze_non_causal_subgroups()
