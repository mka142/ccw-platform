import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker


class MusicalMetaAnalyzer:
    def __init__(self, config):
        self.cfg = config
        self.df_pivot = None  # Dane Z-Score
        self.df_diff = None  # Dane Diff
        self.df_raw = None  # Dane surowe (przed standaryzacją)
        self.label_map = {}  # Mapowanie record_id -> label

        # Kontenery na wyniki
        self.causal_listeners_lags = {}
        self.narrative_trajectories = None

    def load_and_preprocess(self):
        project_name = self.cfg.get("NAME", "Unnamed")
        print(f"\n=== [PROJEKT: {project_name}] Preprocessing Danych ===")

        # 1. Wczytanie
        try:
            df = pd.read_csv(self.cfg["CSV_FILE"])
        except FileNotFoundError:
            print(
                f"(!) Plik {self.cfg['CSV_FILE']} nie istnieje. Generuję dane testowe..."
            )
            df = self._generate_mock_data()

        # 2. Build Label Mapping (if USE_LABEL is enabled and label column exists)
        if self.cfg.get("USE_LABEL", False) and "label" in df.columns:
            self.label_map = (
                df[["record_id", "label"]]
                .drop_duplicates()
                .set_index("record_id")["label"]
                .to_dict()
            )
            print(f"   -> Loaded {len(self.label_map)} label mappings.")

        # 3. Pivot & Interpolacja
        df = df.drop_duplicates(subset=["timestamp", "record_id"])

        self.df_pivot = df.pivot(index="timestamp", columns="record_id", values="value")

        # --- FIX: CLIPPING (NAPRAWA ARTEFAKTÓW EKSTRAPOLACJI) ---
        # Usuwamy wartości spoza zakresu fizycznego interfejsu (0-100)
        # Musimy to zrobić PRZED standaryzacją Z-Score.
        self.df_pivot = self.df_pivot.clip(lower=0, upper=100)

        # Interpolacja braków (teraz bezpieczna, bo punkty brzegowe są poprawne)
        self.df_pivot = self.df_pivot.interpolate(method="linear").fillna(
            method="bfill"
        )

        # Store raw data before standardization
        self.df_raw = self.df_pivot.copy()

        # 4. Z-Score (Standaryzacja)
        stds = self.df_pivot.std().replace(0, 1)
        self.df_pivot = (self.df_pivot - self.df_pivot.mean()) / stds
        self.df_pivot = self.df_pivot.fillna(0)

        # 5. Różnicowanie (Diff)
        self.df_diff = self.df_pivot.diff().fillna(0)

        # 6. Test Dickeya-Fullera (ADF) na stacjonarność
        from statsmodels.tsa.stattools import adfuller

        non_stationary = []
        for col in self.df_diff.columns:
            result = adfuller(self.df_diff[col])
            p_value = result[1]
            if p_value >= 0.05:
                non_stationary.append(col)
        if non_stationary:
            print(
                f"   (!) Uwaga: {len(non_stationary)} szeregów czasowych może być niestacjonarnych (ADF p >= 0.05):"
            )
            print(f"       {non_stationary}")
        else:
            print("   -> Wszystkie szeregi czasowe są stacjonarne według testu ADF.")

        print(
            f"   -> Dane gotowe i naprawione (Clip 0-100). Liczba szeregów: {self.df_diff.shape[1]}"
        )
        print(f"   -> Czas trwania: {self.df_diff.index.max():.2f}s")

    def get_record_label(self, record_id):
        """
        Zwraca label lub record_id w zależności od konfiguracji USE_LABEL.

        Args:
            record_id: ID rekordu (z kolumny record_id)

        Returns:
            str: Label (jeśli USE_LABEL=True i dostępny) lub record_id
        """
        if self.cfg.get("USE_LABEL", False) and record_id in self.label_map:
            return str(self.label_map[record_id])
        return str(record_id)

    def get_output_path(self, base_name, prefix="", suffix="", extension=".csv"):
        """
        Generuje pełną ścieżkę do pliku wyjściowego.
        """
        root_dir = self.cfg.get("OUTPUT_DIR", "analysis_results")
        project_name = self.cfg.get("NAME", "Unnamed_Project")
        target_dir = os.path.join(root_dir, project_name)

        os.makedirs(target_dir, exist_ok=True)

        if extension and not extension.startswith("."):
            extension = "." + extension

        filename = f"{prefix}{base_name}{suffix}{extension}"

        return os.path.join(target_dir, filename)

    def get_time_axis_seconds(self, timestamps):
        """
        Konwertuje timestampy UTC na sekundy od początku nagrania.

        Args:
            timestamps: pandas Index lub array z timestampami (milisekundy UTC)

        Returns:
            numpy array: czas w sekundach od początku
        """
        timestamps_arr = np.array(timestamps)
        start_time = timestamps_arr[0]
        time_seconds = (timestamps_arr - start_time) / 1000.0  # ms -> s
        return time_seconds

    def normalize_to_01(self, data):
        """
        Normalizacja min-max do zakresu [0, 1] dla wizualizacji.
        Funkcja centralna (DRY) - używana przez wszystkie moduły.

        Args:
            data: pandas DataFrame lub Series z danymi

        Returns:
            Znormalizowane dane w zakresie [0, 1]
        """
        if isinstance(data, pd.DataFrame):
            # DataFrame - normalizacja kolumnowa
            result = data.copy()
            for col in data.columns:
                col_min = data[col].min()
                col_max = data[col].max()
                if col_max - col_min < 1e-9:
                    result[col] = 0.5
                else:
                    result[col] = (data[col] - col_min) / (col_max - col_min)
            return result
        else:
            # Series - normalizacja bezpośrednia
            data_min = data.min()
            data_max = data.max()
            if data_max - data_min < 1e-9:
                return pd.Series([0.5] * len(data), index=data.index)
            return (data - data_min) / (data_max - data_min)

    def setup_time_axis(self, ax, timestamps):
        """
        Konfiguruje oś czasu (X) zgodnie z GRID_SIZE z konfiguracji.

        Args:
            ax: matplotlib axis object
            timestamps: pandas Index lub array z timestampami
        """
        time_seconds = self.get_time_axis_seconds(timestamps)
        grid_size = self.cfg.get("GRID_SIZE", 10)  # domyślnie 10 sekund

        ax.set_xlabel("Czas [s]", fontsize=11)
        ax.xaxis.set_major_locator(ticker.MultipleLocator(grid_size))
        ax.xaxis.set_minor_locator(ticker.MultipleLocator(grid_size / 2))
        ax.grid(True, which="major", alpha=0.3)
        ax.grid(True, which="minor", alpha=0.1, linestyle=":")

        return time_seconds

    def graph(self):
        """
        Generuje wykresy odpowiedzi wszystkich uczestników:
        1. Dane standaryzowane (Z-Score) - skala używana w analizach
        2. Dane znormalizowane (0-100) - surowe wartości suwaka
        """
        print("--- [Moduł Core] Generowanie wykresów odpowiedzi ---")

        if self.df_pivot is None or self.df_raw is None:
            print("   (!) Brak danych do wizualizacji.")
            return

        composer_id = self.cfg.get("COMPOSER_ID")
        time_seconds = self.get_time_axis_seconds(self.df_pivot.index)

        # === Wykres 1: Dane Standaryzowane (Z-Score) ===
        fig, ax = plt.subplots(figsize=(16, 8))

        # Liczba uczestników (bez kompozytora)
        n_participants = len(self.df_pivot.columns) - 1

        for col in self.df_pivot.columns:
            if col == composer_id:
                label = self.get_record_label(col)
                ax.plot(
                    time_seconds,
                    self.df_pivot[col],
                    label=f"KOMPOZYTOR: {label}",
                    linewidth=2.5,
                    color="red",
                    alpha=0.9,
                    zorder=10,
                )
            else:
                # Uczestnicy z kolorami, ale bez etykiet
                ax.plot(time_seconds, self.df_pivot[col], linewidth=0.8, alpha=0.6)

        self.setup_time_axis(ax, self.df_pivot.index)
        ax.set_ylabel("Wynik standaryzowany (Z-Score)", fontsize=11)
        ax.set_title(
            f"Odpowiedzi uczestników - Wyniki standaryzowane\n{self.cfg.get('NAME', '')} (n={n_participants})",
            fontsize=13,
            fontweight="bold",
        )
        ax.legend(loc="upper right", fontsize=10)

        img_path = self.get_output_path(
            base_name="responses_standardized", prefix="00_", extension=".png"
        )
        plt.tight_layout()
        plt.savefig(img_path, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"   -> Wykres standaryzowany zapisany: {img_path}")

        img_path = self.get_output_path(
            base_name="responses_normalized", prefix="00_", extension=".png"
        )
        plt.tight_layout()
        plt.savefig(img_path, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"   -> Wykres znormalizowany zapisany: {img_path}")

        # === Wykres 2: Dane Znormalizowane (0-100) ===
        fig, ax = plt.subplots(figsize=(16, 8))

        for col in self.df_raw.columns:
            if col == composer_id:
                label = self.get_record_label(col)
                ax.plot(
                    time_seconds,
                    self.df_raw[col],
                    label=f"KOMPOZYTOR: {label}",
                    linewidth=2.5,
                    color="red",
                    alpha=0.9,
                    zorder=10,
                )
            else:
                # Uczestnicy z kolorami, ale bez etykiet
                ax.plot(time_seconds, self.df_raw[col], linewidth=0.8, alpha=0.6)

        self.setup_time_axis(ax, self.df_raw.index)
        ax.set_ylabel("Wartość suwaka [0-100]", fontsize=11)
        ax.set_title(
            f"Odpowiedzi uczestników - Dane znormalizowane\n{self.cfg.get('NAME', '')} (N={n_participants})",
            fontsize=13,
            fontweight="bold",
        )
        ax.legend(loc="upper right", fontsize=10)
        ax.set_ylim(-5, 105)

        img_path = self.get_output_path(
            base_name="responses_normalized", prefix="00_", extension=".png"
        )
        plt.tight_layout()
        plt.savefig(img_path, dpi=150, bbox_inches="tight")
        plt.close()
        print(f"   -> Wykres znormalizowany zapisany: {img_path}")

    def _generate_mock_data(self):
        """Generuje dane testowe z błędami (overshoot) do sprawdzenia fixa."""
        time_steps = 1000
        t = np.linspace(0, 50, time_steps)
        data = []

        comp_id = self.cfg.get("COMPOSER_ID", "composer_mock")
        # Generujemy wartości wychodzące poza skalę (np. -5 do 105)
        comp_sig = np.sin(t * 0.5) * 55 + 50

        for i, v in enumerate(comp_sig):
            data.append([t[i], comp_id, v])

        for k in range(5):
            sig = np.roll(comp_sig, 10) + np.random.normal(0, 2, time_steps)
            for i, v in enumerate(sig):
                data.append([t[i], f"listener_{k}", v])

        return pd.DataFrame(data, columns=["timestamp", "record_id", "value"])
