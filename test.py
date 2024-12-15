# import tkinter as tk
# from tkinter import ttk
# import pygetwindow as gw

# def list_open_windows():
#     windows = gw.getAllTitles()
#     return [win for win in windows if win]

# def select_window():
#     selected_window_title = window_listbox.get(window_listbox.curselection())
#     selected_window = gw.getWindowsWithTitle(selected_window_title)[0]
#     selected_window.minimize()
#     selected_window.activate()

# def show_selected_window():
#     select_window()
#     # Place your code here to embed or display the selected window inside Tkinter window
#     # This part of functionality may require platform-specific implementations
#     # and might not be straightforward using Tkinter alone.
#     # You might need additional libraries or system calls to achieve this.
#     pass

# # Create the main window
# root = tk.Tk()
# root.title("Window Selector")
# root.geometry("400x300")

# # Create a frame for the listbox and scrollbar
# frame = tk.Frame(root)
# frame.pack(pady=20)

# # Create a scrollbar
# scrollbar = tk.Scrollbar(frame, orient=tk.VERTICAL)

# # Create a listbox
# window_listbox = tk.Listbox(frame, width=50, yscrollcommand=scrollbar.set)
# scrollbar.config(command=window_listbox.yview)
# scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
# window_listbox.pack(side=tk.LEFT, fill=tk.BOTH)

# # List all open windows
# windows = list_open_windows()
# for window in windows:
#     window_listbox.insert(tk.END, window)

# # Create a button to select and display the window
# select_button = ttk.Button(root, text="Select Window", command=show_selected_window)
# select_button.pack(pady=20)

# # Run the application
# root.mainloop()
import tkinter as tk
from tkinter import ttk
import pygetwindow as gw
import win32gui
import win32con

def list_open_windows():
    windows = gw.getAllTitles()
    return [win for win in windows if win]

def embed_window(parent_hwnd, child_hwnd):
    # Set the selected window as a child of the Tkinter window
    win32gui.SetParent(child_hwnd, parent_hwnd)
    
    def resize_child_window():
        # Get the size of the parent window
        parent_rect = win32gui.GetClientRect(parent_hwnd)
        parent_pos = win32gui.ClientToScreen(parent_hwnd, (0, 0))
        # Resize the child window to fit the parent window
        win32gui.SetWindowPos(child_hwnd, win32con.HWND_TOP, parent_pos[0], parent_pos[1],
                              parent_rect[2], parent_rect[3],
                              win32con.SWP_NOACTIVATE | win32con.SWP_NOZORDER)
    
    # Initial resize
    # resize_child_window()
    
    # Bind the resize event to adjust the child window size dynamically
    # def on_resize(event):
        # resize_child_window()
    
    # root.bind("<Configure>", on_resize)

def open_window_as_new(title):
    hwnd = win32gui.FindWindow(None, title)
    if hwnd:
        # Create a new top-level window
        new_window = tk.Toplevel(root)
        new_window.title(f"Embedded Window - {title}")
        new_window.geometry("800x600")
        
        # Update new window geometry
        new_window.update_idletasks()

        # Embed the selected window into the new Tkinter window
        embed_window(new_window.winfo_id(), hwnd)

def select_window():
    selected_window_title = window_listbox.get(window_listbox.curselection())
    open_window_as_new(selected_window_title)

# Create the main window
root = tk.Tk()
root.title("Window Selector")
root.geometry("400x300")

# Create a frame for the listbox and scrollbar
frame = tk.Frame(root)
frame.pack(pady=20, fill=tk.BOTH, expand=True)

# Create a scrollbar
scrollbar = tk.Scrollbar(frame, orient=tk.VERTICAL)

# Create a listbox
window_listbox = tk.Listbox(frame, width=50, yscrollcommand=scrollbar.set)
scrollbar.config(command=window_listbox.yview)
scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
window_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

# List all open windows
windows = list_open_windows()
for window in windows:
    window_listbox.insert(tk.END, window)

# Create a button to select and embed the window
select_button = ttk.Button(root, text="Embed Window", command=select_window)
select_button.pack(pady=20)

# Run the application
root.mainloop()
