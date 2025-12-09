import numpy as np


def assign_ranks(values):
    """Assign ranks to values (handling ties with average ranks)"""
    n = len(values)

    # Create array of indices sorted by values
    indices = np.argsort(values)
    ranks = np.empty(n)

    i = 0
    while i < n:
        j = i
        # Find all tied values
        while j < n and values[indices[j]] == values[indices[i]]:
            j += 1

        # Assign average rank to all tied values (ranks are 1-based)
        avg_rank = (i + j + 1) / 2
        for k in range(i, j):
            ranks[indices[k]] = avg_rank

        i = j

    return ranks


def calculate_spearman_correlation(arr1, arr2):
    """Calculate Spearman's rank correlation coefficient"""
    if len(arr1) == 0 or len(arr2) == 0 or len(arr1) != len(arr2):
        return 0.0

    n = len(arr1)

    # Assign ranks
    ranks1 = assign_ranks(arr1)
    ranks2 = assign_ranks(arr2)

    # Calculate sum of squared differences
    sum_squared_diff = np.sum((ranks1 - ranks2) ** 2)

    # Spearman's rank correlation coefficient formula
    rho = 1 - (6 * sum_squared_diff) / (n * (n * n - 1))

    return rho
