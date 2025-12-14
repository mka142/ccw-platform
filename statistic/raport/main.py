import matplotlib.pyplot as plt
import warnings
import time
from core import MusicalMetaAnalyzer
from granger import GrangerModule
from narrative import NarrativeModule
from clustering import ClusteringModule  # <--- NOWY IMPORT

# --- KONFIGURACJA ---
plt.style.use("seaborn-v0_8-whitegrid")
warnings.filterwarnings("ignore")

CONFIGS = [
    { 
        "NAME": "K1 Łabowska",
        "CSV_FILE": "plik.csv", # Fill in with actual file path
        "SAMPLING_RATE_HZ": 50,
        "WINDOW_SECONDS": 15,
        "COMPOSER_ID": "", # Fill in with actual ID
        "GRANGER_MAX_LAG_SEC": 4.0,
        "GRANGER_P_VALUE_THRESHOLD": 0.05,
        "OUTPUT_DIR": "analysis_results",
        "USE_LABEL": True,  # Use label column instead of record_id in graphs and exports
        "GRID_SIZE": 10,  # Grid size for time axis in seconds
    },
   
]

if __name__ == "__main__":
    print(f"Uruchamianie przetwarzania dla {len(CONFIGS)} projektów...\n")

    total_start = time.time()

    for config in CONFIGS:
        config_start = time.time()
        print(f"\n{'='*60}")
        print(f"Projekt: {config['NAME']}")
        print(f"{'='*60}\n")

        # 1. Inicjalizacja i Preprocessing
        step_start = time.time()
        analyzer = MusicalMetaAnalyzer(config)
        analyzer.load_and_preprocess()
        print(f"  [✓] Preprocessing: {time.time() - step_start:.2f}s")

        # 1.5. Podstawowe wykresy odpowiedzi
        step_start = time.time()
        analyzer.graph()
        print(f"  [✓] Podstawowe wykresy: {time.time() - step_start:.2f}s")

        # 2. Moduł 1: Granger (Filtrowanie i Lagi)
        step_start = time.time()
        granger_module = GrangerModule(analyzer)
        granger_module.run_analysis()
        granger_module.export_results()
        granger_module.export_graph()
        print(f"  [✓] Analiza Granger: {time.time() - step_start:.2f}s")

        # 3. Moduł 2: Narrative (Trajektorie Spójności)
        step_start = time.time()
        narrative_module = NarrativeModule(analyzer)
        narrative_module.run_analysis()
        narrative_module.export_results()
        narrative_module.export_graph()
        print(f"  [✓] Analiza Narrative: {time.time() - step_start:.2f}s")

        # 4. Moduł 3: Clustering (Podgrupy)
        step_start = time.time()
        clustering_module = ClusteringModule(analyzer)
        clustering_module.run_analysis()
        clustering_module.export_results()
        clustering_module.export_heatmap()
        clustering_module.export_cluster_means_graph()
        print(f"  [✓] Analiza Clustering: {time.time() - step_start:.2f}s")

        config_time = time.time() - config_start
        print(
            f"\n--- Zakończono: {config['NAME']} (Łączny czas: {config_time:.2f}s) ---\n"
        )

    total_time = time.time() - total_start
    print(f"\n{'='*60}")
    print(f"=== WSZYSTKIE ZADANIA UKOŃCZONE ===")
    print(f"Całkowity czas wykonania: {total_time:.2f}s ({total_time/60:.2f} min)")
    print(f"{'='*60}")
