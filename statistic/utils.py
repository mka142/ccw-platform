"""
Utility functions for interactive option selection
"""

from typing import List, Dict, Callable, Any, Optional, Tuple


class OptionSelector:
    """
    A flexible interactive option selector that handles:
    - Numeric selection (1-N)
    - Special keys (e.g., 'a' for all, 'c' for custom, 'e' for exclude)
    - Custom handlers for special keys
    - Different return types (single value, list, etc.)
    """
    
    def __init__(
        self,
        options: List[Any],
        display_func: Optional[Callable[[Any, int], str]] = None,
        value_extractor: Optional[Callable[[Any], Any]] = None,
        success_message_func: Optional[Callable[[Any], str]] = None,
        special_keys: Optional[Dict[str, Dict[str, Any]]] = None,
        allow_all: bool = True,
        prompt: Optional[str] = None,
        max_display: int = 10,
    ):
        """
        Initialize the option selector.
        
        Args:
            options: List of options to select from
            display_func: Function to format option display (option, index) -> str
                         If None, uses str(option)
            value_extractor: Function to extract value from option (option) -> value
                            If None, returns the option itself
            special_keys: Dict mapping special keys to handlers
                         Format: {'key': {'label': str, 'handler': Callable}}
            allow_all: Whether to show 'a' for ALL option (default: True)
            prompt: Custom prompt string (default: auto-generated)
            max_display: Maximum number of options to display before showing "... and X more"
        """
        self.options = options
        self.display_func = display_func or (lambda opt, idx: f"  {idx}. {opt}")
        self.value_extractor = value_extractor or (lambda opt: opt)
        self.success_message_func = success_message_func or (lambda opt: str(opt))
        self.special_keys = special_keys or {}
        self.allow_all = allow_all
        self.prompt = prompt
        self.max_display = max_display
        
    def display_options(self):
        """Display available options"""
        if not self.options:
            print("No options available!")
            return
            
        # Display numbered options
        display_count = min(len(self.options), self.max_display)
        for i in range(display_count):
            option = self.options[i]
            print(self.display_func(option, i + 1))
            
        if len(self.options) > self.max_display:
            print(f"  ... and {len(self.options) - self.max_display} more")
        
        # Display special keys
        if self.allow_all:
            print(f"  a. ALL")
            
        for key, config in self.special_keys.items():
            print(f"  {key}. {config['label']}")
    
    def select_single(self) -> Any:
        """
        Select a single option and return its value.
        Returns None if no valid selection.
        """
        if not self.options:
            return None
            
        self.display_options()
        
        # Build prompt
        if self.prompt:
            prompt_text = self.prompt
        else:
            special_chars = ['a'] if self.allow_all else []
            special_chars.extend(self.special_keys.keys())
            special_part = f" or '{'/'.join(special_chars)}'" if special_chars else ""
            prompt_text = f"\nSelect option (1-{len(self.options)}{special_part}): "
        
        while True:
            choice = input(prompt_text).strip().lower()
            
            # Check special keys
            if self.allow_all and choice == 'a':
                print("Selected: ALL")
                return [self.value_extractor(opt) for opt in self.options]
            
            if choice in self.special_keys:
                handler = self.special_keys[choice]['handler']
                result = handler(self.options, self.value_extractor)
                if result is not None:
                    return result
                continue
            
            # Try numeric selection
            try:
                choice_num = int(choice)
                if 1 <= choice_num <= len(self.options):
                    selected = self.options[choice_num - 1]
                    value = self.value_extractor(selected)
                    print(f"Selected: {self.success_message_func(selected)}")
                    return value
                else:
                    print("Invalid choice. Try again.")
            except ValueError:
                special_chars = ['a'] if self.allow_all else []
                special_chars.extend(self.special_keys.keys())
                if special_chars:
                    print(f"Invalid input. Enter a number (1-{len(self.options)}) or '{'/'.join(special_chars)}'.")
                else:
                    print(f"Invalid input. Enter a number (1-{len(self.options)}).")
    
    def select_multiple(self) -> List[Any]:
        """
        Select one or more options and return a list of values.
        Returns empty list if no valid selection.
        """
        if not self.options:
            return []
            
        self.display_options()
        
        # Build prompt
        if self.prompt:
            prompt_text = self.prompt
        else:
            special_chars = ['a'] if self.allow_all else []
            special_chars.extend(self.special_keys.keys())
            special_part = f" or '{'/'.join(special_chars)}'" if special_chars else ""
            prompt_text = f"\nSelect option (1-{len(self.options)}{special_part}): "
        
        while True:
            choice = input(prompt_text).strip().lower()
            
            # Check special keys
            if self.allow_all and choice == 'a':
                print("Selected: ALL")
                return [self.value_extractor(opt) for opt in self.options]
            
            if choice in self.special_keys:
                handler = self.special_keys[choice]['handler']
                result = handler(self.options, self.value_extractor)
                if result is not None:
                    return result if isinstance(result, list) else [result]
                continue
            
            # Try numeric selection
            try:
                choice_num = int(choice)
                if 1 <= choice_num <= len(self.options):
                    selected = self.options[choice_num - 1]
                    value = self.value_extractor(selected)
                    print(f"Selected: {self.success_message_func(selected)}")
                    return [value]
                else:
                    print("Invalid choice. Try again.")
            except ValueError:
                special_chars = ['a'] if self.allow_all else []
                special_chars.extend(self.special_keys.keys())
                if special_chars:
                    print(f"Invalid input. Enter a number (1-{len(self.options)}) or '{'/'.join(special_chars)}'.")
                else:
                    print(f"Invalid input. Enter a number (1-{len(self.options)}).")


def create_user_custom_handler(
    id_key: str = "id"
) -> Callable[[List[Any], Callable], Optional[List[str]]]:
    """
    Create a handler for custom user ID selection.
    
    Args:
        id_key: Key to extract ID from user dict (default: "id")
    
    Returns:
        Handler function for 'c' (custom) option
    """
    def handler(options: List[Any], value_extractor: Callable) -> Optional[List[str]]:
        print("\nEnter user IDs (comma-separated):")
        print("You can use full IDs or first 8 characters")
        custom_input = input("IDs: ").strip()
        
        if not custom_input:
            print("No IDs provided. Try again.")
            return None
        
        # Parse input
        input_ids = [id.strip() for id in custom_input.split(",")]
        
        # Match IDs (support partial matching)
        matched_users = []
        for input_id in input_ids:
            for user in options:
                user_id = user.get(id_key, "") if isinstance(user, dict) else str(user)
                if user_id == input_id or user_id.startswith(input_id):
                    if user_id not in matched_users:
                        matched_users.append(user_id)
                    break
        
        if matched_users:
            print(f"Selected: {len(matched_users)} users")
            for uid in matched_users:
                print(f"  - {uid[:8]}...")
            return matched_users
        else:
            print("No matching users found. Try again.")
            return None
    
    return handler


def create_user_exclude_handler(
    id_key: str = "id"
) -> Callable[[List[Any], Callable], Optional[List[str]]]:
    """
    Create a handler for excluding users.
    
    Args:
        id_key: Key to extract ID from user dict (default: "id")
    
    Returns:
        Handler function for 'e' (exclude) option
    """
    def handler(options: List[Any], value_extractor: Callable) -> Optional[List[str]]:
        print("\nEnter user IDs to EXCLUDE (comma-separated):")
        print("You can use full IDs or first 8 characters")
        exclude_input = input("IDs to exclude: ").strip()
        
        if not exclude_input:
            # No exclusions, use all
            all_ids = [
                u.get(id_key, "") if isinstance(u, dict) else str(u)
                for u in options
            ]
            print(f"No exclusions. Selected: ALL {len(options)} users")
            return all_ids
        
        # Parse exclusion list
        exclude_ids = [id.strip() for id in exclude_input.split(",")]
        
        # Match exclusion IDs
        excluded_users = set()
        for exclude_id in exclude_ids:
            for user in options:
                user_id = user.get(id_key, "") if isinstance(user, dict) else str(user)
                if user_id == exclude_id or user_id.startswith(exclude_id):
                    excluded_users.add(user_id)
                    break
        
        # Get remaining users
        remaining_users = []
        for user in options:
            user_id = user.get(id_key, "") if isinstance(user, dict) else str(user)
            if user_id not in excluded_users:
                remaining_users.append(user_id)
        
        if remaining_users:
            print(f"Excluded: {len(excluded_users)} users")
            print(f"Selected: {len(remaining_users)} users")
            return remaining_users
        else:
            print("All users would be excluded. Try again.")
            return None
    
    return handler

