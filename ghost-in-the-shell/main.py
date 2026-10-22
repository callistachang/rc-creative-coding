import subprocess
import time
import unicodedata

CELEBRATION_DURATION_SECONDS = 2
IDLE_THRESHOLD_SECONDS = 15


def tmux(*args):
    return subprocess.run(
        ["tmux", *args], capture_output=True, text=True
    ).stdout.strip()  # type: ignore


now = time.time()

# -F tells `tmux list-clients` how to format each client's output.
# ${client_activity} expands to the time the client was last active.
activities = tmux("list-clients", "-F", "#{client_activity}")
last_active = max((int(t) for t in activities.splitlines() if t.isdigit()), default=now)

# In tmux.conf, we set the tmux custom option @ghost_burst to the latest timestamp that <enter> was pressed.
burst = float(tmux("show-option", "-gqv", "@ghost_burst") or 0)

if 0 <= now - burst < CELEBRATION_DURATION_SECONDS:
    face = "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧"
elif now - last_active > IDLE_THRESHOLD_SECONDS:
    face = "(－_－) zzZ"
else:
    face = "(｡◕‿◕｡)"


# Count terminal cells so fullwidth characters do not shift the padded faces.
def width(s):
    return sum(
        0
        if unicodedata.combining(c)
        else 2
        if unicodedata.east_asian_width(c) in "FW"
        else 1
        for c in s
    )


print(face + " " * max(0, 22 - width(face)))
