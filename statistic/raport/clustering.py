import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import squareform


class ClusteringModule:
    def __init__(self, analyzer_instance):
        """
        Moduł Profilowania Słuchaczy (Listener Profiling).
        Grupuje uczestników ORAZ KOMPOZYTORA na podstawie podobieństwa przebiegów.

        METODOLOGIA:
        Zastosowano korelację rangową Spearmana (zamiast Pearsona).

        Uzasadnienie:
        Dane z suwaków (CRM) rzadko spełniają założenie normalności rozkładu (efekty sufitu/podłogi,
        skośność rozkładu napięcia w czasie). Spearman jest miarą nieparametryczną, opartą na rangach,
        co pozwala na ocenę podobieństwa monotonicznego (zgodność trendów: rośnie/maleje)
        niezależnie od nieliniowej skali ekspresji ruchowej badanych.
        """
        self.parent = analyzer_instance
        self.cfg = analyzer_instance.cfg

        # Używamy Z-Score z klasy bazowej (dane znormalizowane)
        self.raw_data = analyzer_instance.df_pivot

        self.cluster_df = None
        self.similarity_matrix = None
        self.linkage_matrix = None
        self.valid_cols = []

    def run_analysis(self):
        print("--- [Moduł Clustering] Profilowanie (Spearman + Kompozytor) ---")

        if self.raw_data is None or self.raw_data.empty:
            print("   (!) Brak danych wejściowych.")
            return None

        composer_id = self.cfg["COMPOSER_ID"]

        # 1. Wybór kolumn: Słuchacze + Kompozytor
        # Filtrujemy sygnały płaskie (brak wariancji uniemożliwia korelację)
        self.valid_cols = [
            c for c in self.raw_data.columns if self.raw_data[c].std() > 1e-4
        ]

        if composer_id not in self.valid_cols:
            print(
                f"   (!) Ostrzeżenie: Kompozytor {composer_id} ma płaski sygnał lub brak danych."
            )

        if len(self.valid_cols) < 3:
            print("   (!) Zbyt mało aktywnych sygnałów do klastrowania (< 3).")
            return None

        print(f"   Analiza kształtu (Spearman) dla {len(self.valid_cols)} sygnałów...")

        subset_df = self.raw_data[self.valid_cols]

        # 2. Macierz Podobieństwa (SPEARMAN)
        # Zmiana z 'pearson' na 'spearman' - kluczowa dla poprawności statystycznej
        self.similarity_matrix = subset_df.corr(method="spearman")

        # Rename axes to use labels if configured
        label_mapping = {
            col: self.parent.get_record_label(col) for col in self.valid_cols
        }
        self.similarity_matrix = self.similarity_matrix.rename(
            index=label_mapping, columns=label_mapping
        )

        # 3. Klasteryzacja Hierarchiczna
        # Zamiana korelacji na dystans (1 - rho)
        dist_matrix = np.clip(1 - self.similarity_matrix, 0, 2)

        try:
            # Metoda Warda minimalizuje wariancję wewnątrz klastrów.
            # Choć Ward teoretycznie zakłada dystans euklidesowy, w praktyce badawczej (bioinformatyka, psychologia)
            # stosowanie go na dystansie korelacyjnym (Spearman distance) jest standardem do wykrywania "kształtów".
            self.linkage_matrix = linkage(squareform(dist_matrix), method="ward")

            # 4. Wyodrębnienie grup
            threshold = 0.7 * max(self.linkage_matrix[:, 2])
            cluster_labels = fcluster(
                self.linkage_matrix, t=threshold, criterion="distance"
            )

            # Wyniki - używamy labeli zamiast record_id jeśli skonfigurowano
            record_labels = [
                self.parent.get_record_label(rid) for rid in self.valid_cols
            ]
            self.cluster_df = pd.DataFrame(
                {"record_id": record_labels, "cluster_id": cluster_labels}
            )

            # Lokalizacja kompozytora
            comp_cluster = "Brak"
            if composer_id in self.valid_cols:
                comp_label = self.parent.get_record_label(composer_id)
                comp_row = self.cluster_df[self.cluster_df["record_id"] == comp_label]
                if not comp_row.empty:
                    comp_cluster = comp_row["cluster_id"].values[0]

            self.cluster_df = self.cluster_df.sort_values(
                by=["cluster_id", "record_id"]
            )

            num_clusters = self.cluster_df["cluster_id"].nunique()
            print(f"   -> Zidentyfikowano {num_clusters} profili.")
            print(f"   -> KOMPOZYTOR znajduje się w Klastrze nr: {comp_cluster}")

        except Exception as e:
            print(f"   (!) Błąd obliczeń klasteryzacji: {str(e)}")
            return None

        return self.cluster_df

    def export_results(self):
        if self.cluster_df is None:
            return

        # --- A. Mapa Grup ---
        mapping_path = self.parent.get_output_path(
            base_name="listener_profiles_spearman", prefix="03_", extension=".csv"
        )
        self.cluster_df.to_csv(mapping_path, index=False)
        print(f"   -> Mapa profili zapisana: {mapping_path}")

        # --- B. Średnie Przebiegi (Archetypy) - CSV ---
        try:
            unique_clusters = sorted(self.cluster_df["cluster_id"].unique())
            means_df = pd.DataFrame(index=self.raw_data.index)

            composer_id = self.cfg["COMPOSER_ID"]
            if composer_id in self.raw_data.columns:
                comp_label = self.parent.get_record_label(composer_id)
                means_df[f"COMPOSER_RAW_{comp_label}"] = self.raw_data[composer_id]

            # Map back from labels to record_ids for data access
            label_to_rid = {
                self.parent.get_record_label(rid): rid for rid in self.valid_cols
            }

            for cid in unique_clusters:
                member_labels = self.cluster_df[self.cluster_df["cluster_id"] == cid][
                    "record_id"
                ]
                # Convert labels back to record_ids to access data
                member_rids = [
                    label_to_rid.get(lbl, lbl)
                    for lbl in member_labels
                    if lbl in label_to_rid or lbl in self.raw_data.columns
                ]

                suffix = ""
                comp_label = (
                    self.parent.get_record_label(composer_id)
                    if composer_id in self.raw_data.columns
                    else None
                )
                if comp_label in member_labels.values:
                    suffix = "_(CONTAINS_COMPOSER)"

                means_df[f"Profile_{cid}_Mean{suffix}"] = self.raw_data[
                    member_rids
                ].mean(axis=1)

            means_path = self.parent.get_output_path(
                base_name="profiles_archetypes_spearman", prefix="03_", extension=".csv"
            )
            means_df.to_csv(means_path, index=True)
            print(f"   -> Archetypy profili zapisane: {means_path}")

        except Exception as e:
            print(f"   (!) Błąd eksportu archetypów: {e}")

    def export_heatmap(self):
        """
        Eksportuje heatmapę macierzy podobieństwa (Spearman) z dendrogramem.
        """
        if self.similarity_matrix is None or self.linkage_matrix is None:
            print("   (!) Brak danych do heatmapy.")
            return

        print("   Generowanie heatmapy macierzy podobieństwa...")

        try:
            g = sns.clustermap(
                self.similarity_matrix,
                row_linkage=self.linkage_matrix,
                col_linkage=self.linkage_matrix,
                cmap="RdBu_r",
                center=0,
                vmin=-1,
                vmax=1,
                figsize=(16, 16),  # Zwiększony rozmiar z 12x12 do 16x16
                dendrogram_ratio=(
                    0.12,
                    0.12,
                ),  # Zmniejszony dendrogram dla lepszych proporcji
                cbar_pos=(
                    0.02,
                    0.9,
                    0.03,
                    0.08,
                ),  # Przesunięta wyżej i zmniejszona legenda kolorów
                cbar_kws={"label": "Korelacja Rangowa Spearmana"},
                xticklabels=True,
                yticklabels=True,
                annot=True,  # Dodanie wartości liczbowych
                fmt=".2f",  # Format: 2 miejsca po przecinku
                annot_kws={"size": 6, "weight": "normal"},  # Rozmiar i styl czcionki
            )

            g.fig.suptitle(
                f"Macierz Podobieństwa (Spearman): {self.cfg.get('NAME', '')}",
                y=1.01,  # Przesunięty niżej tytuł
                fontsize=14,
            )

            # Formatowanie etykiet
            plt.setp(g.ax_heatmap.get_xticklabels(), fontsize=8)
            plt.setp(g.ax_heatmap.get_yticklabels(), fontsize=8)

            img_path = self.parent.get_output_path(
                base_name="profiles_heatmap_spearman", prefix="03_", extension=".png"
            )
            g.savefig(img_path, dpi=150, bbox_inches="tight")
            plt.close("all")
            print(f"   -> Heatmapa zapisana: {img_path}")

        except Exception as e:
            print(f"   (!) Błąd grafiki heatmapy: {e}")

    def export_cluster_means_graph(self):
        """
        Generuje wykres średnich odpowiedzi dla każdego klastra.
        Oznacza klaster zawierający kompozytora.
        """
        if self.cluster_df is None:
            print("   (!) Brak danych klastrów do wykresu.")
            return

        print("   Generowanie wykresu średnich klastrów...")

        try:
            composer_id = self.cfg["COMPOSER_ID"]
            unique_clusters = sorted(self.cluster_df["cluster_id"].unique())

            # Używamy danych standaryzowanych (Z-Score) ponieważ klasteryzacja była na Z-Score
            df_pivot = self.parent.df_pivot
            time_seconds = self.parent.get_time_axis_seconds(df_pivot.index)

            # Mapowanie label -> record_id
            label_to_rid = {
                self.parent.get_record_label(rid): rid for rid in self.valid_cols
            }

            # Znajdź klaster kompozytora
            comp_label = (
                self.parent.get_record_label(composer_id)
                if composer_id in df_pivot.columns
                else None
            )
            composer_cluster_id = None
            if comp_label:
                comp_row = self.cluster_df[self.cluster_df["record_id"] == comp_label]
                if not comp_row.empty:
                    composer_cluster_id = comp_row["cluster_id"].values[0]

            # Tworzenie wykresu
            fig, ax = plt.subplots(figsize=(16, 9))

            colors = plt.cm.tab10(np.linspace(0, 1, len(unique_clusters)))

            for idx, cid in enumerate(unique_clusters):
                member_labels = self.cluster_df[self.cluster_df["cluster_id"] == cid][
                    "record_id"
                ]
                member_rids = [
                    label_to_rid.get(lbl, lbl)
                    for lbl in member_labels
                    if lbl in label_to_rid or lbl in df_pivot.columns
                ]

                if not member_rids:
                    continue

                cluster_mean = df_pivot[member_rids].mean(axis=1)

                # Oznaczenie klastra kompozytora
                if cid == composer_cluster_id:
                    ax.plot(
                        time_seconds,
                        cluster_mean,
                        color="red",
                        linewidth=3.5,
                        alpha=0.9,
                        label=f"Klaster {cid} ★ KOMPOZYTOR ★ (n={len(member_rids)})",
                        zorder=10,
                    )
                else:
                    ax.plot(
                        time_seconds,
                        cluster_mean,
                        color=colors[idx],
                        linewidth=2.5,
                        alpha=0.8,
                        label=f"Klaster {cid} (n={len(member_rids)})",
                    )

            # Konfiguracja osi
            self.parent.setup_time_axis(ax, df_pivot.index)
            ax.set_ylabel("Średni wynik standaryzowany (Z-Score)", fontsize=11)
            ax.set_title(
                f"Średnie odpowiedzi klastrów (Spearman)\n{self.cfg.get('NAME', '')}\n"
                f"Liczba klastrów: {len(unique_clusters)}",
                fontsize=13,
                fontweight="bold",
            )
            ax.legend(loc="upper right", fontsize=10, framealpha=0.9)
            ax.grid(True, alpha=0.3)

            # Zapis
            img_path = self.parent.get_output_path(
                base_name="cluster_means_visual", prefix="03_", extension=".png"
            )
            plt.tight_layout()
            plt.savefig(img_path, dpi=150, bbox_inches="tight")
            plt.close()
            print(f"   -> Wykres średnich klastrów zapisany: {img_path}")

        except Exception as e:
            print(f"   (!) Błąd wykresu klastrów: {e}")
