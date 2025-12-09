from load import (
    load_ready_data,
    load_tags_config,
    filter_by_tags,
    standardize_data,
    difference_data,
)
import numpy as np


from func import calculate_spearman_correlation


CONFIG = {
    "FILE_PATH": "",  # global-data.csv
    "TAGS_CONFIG_FILE": "",  # config_sample.txt
    "TAGS_CSV_FILE": "",  # examination_form.csv || Formularz - Arkusz.csv
}

if __name__ == "__main__":
    try:
        # Load data with record_id preserved
        series = load_ready_data(CONFIG["FILE_PATH"])

        series = standardize_data(series)
        series = difference_data(series)

        series_copy = series.copy()
        # Load tags config .txt file (optional)
        """contig_sample.txt
        płeć: mężczyzna, kobieta
        wykształcenie: średnie ogólne
        preferencje muzyczne wartość: 2<=x<=4
        """
        config = load_tags_config(CONFIG["TAGS_CONFIG_FILE"])

        # Filter by tags - only keep records where gender is 'kobieta'
        series = filter_by_tags(
            series,
            tags_csv_file=CONFIG["TAGS_CSV_FILE"],
            tag_filters={},
            tags_config=config,
        )

        # Calculate Spearman correlation with KOMPOZYTOR
        kompozytor_series = series_copy.xs("KOMPOZYTOR", level=1)
        komp_arr = kompozytor_series.iloc[0]

        print(f"KOMPOZYTOR array length: {len(komp_arr)}")

        # Load tags to get user metadata
        from load import read_csv_to_dict

        tags_dict = read_csv_to_dict(CONFIG["TAGS_CSV_FILE"])

        # Calculate correlations with metadata
        correlation_data = []
        for idx, arr in series.items():
            record_id, label = idx
            if label != "KOMPOZYTOR":
                # Extract user_id from record_id
                if isinstance(record_id, str) and record_id.startswith("global:"):
                    user_id = record_id.split(":", 1)[1]
                else:
                    user_id = str(record_id)

                # Get user tags
                user_data = tags_dict.get(user_id, {})

                # Calculate correlation
                corr = calculate_spearman_correlation(arr, komp_arr)

                if not np.isnan(corr):
                    correlation_data.append(
                        {
                            "record_id": record_id,
                            "label": label,
                            "correlation": corr,
                            "płeć": user_data.get("płeć", "unknown"),
                            "wiek": user_data.get("wiek", "unknown"),
                            "wykształcenie": user_data.get("wykształcenie", "unknown"),
                            "wykszt. muz.": user_data.get("wykszt. muz.", "unknown"),
                        }
                    )

        import matplotlib.pyplot as plt

        # plot with correlation histogram
        correlations = [item["correlation"] for item in correlation_data]
        plt.hist(correlations, bins=20, edgecolor="black")
        plt.title("Histogram korelacji Spearmana z KOMPOZYTOR")
        plt.xlabel("Korelacja Spearmana")
        plt.ylabel("Liczba użytkowników")
        plt.grid(axis="y", alpha=0.75)
        plt.show()

    except Exception as e:
        print(f"Błąd: {e}")
        import traceback

        traceback.print_exc()
        exit()
