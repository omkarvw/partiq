from pathlib import Path
import re

root = Path(r"d:\Projects\Part Management\part-management\src")
patterns = [
    (r'(["\'/`])\/v2\/dashboard', r"\1/dashboard"),
    (r'(["\'/`])\/v2\/factory', r"\1/factory"),
    (r'(["\'/`])\/v2\/impact', r"\1/impact"),
    (r'(["\'/`])\/v2\/baselines', r"\1/baselines"),
    (r'(["\'/`])\/v2\/settings', r"\1/settings"),
    (r'(["\'/`])\/v2\/setup', r"\1/setup"),
    (r'(["\'/`])\/v2\/welcome', r"\1/welcome"),
    (r'(["\'/`])\/v2\/tour', r"\1/tour"),
    (r'(["\'/`])\/v2\/capacity', r"\1/capacity"),
    (r'(["\'/`])\/v2(["\'/`])', r"\1/dashboard\2"),
    (r'(["\'/`])\/v1\/parts', r"\1/parts"),
    (r'(["\'/`])\/v1\/customers', r"\1/customers"),
    (r'(["\'/`])\/v1\/factory', r"\1/factory"),
    (r'(["\'/`])\/v1\/impact', r"\1/impact"),
    (r'(["\'/`])\/v1\/baselines', r"\1/baselines"),
    (r'(["\'/`])\/v1\/scenarios', r"\1/baselines"),
    (r'(["\'/`])\/v1\/settings', r"\1/settings"),
    (r'(["\'/`])\/v1\/dashboard', r"\1/dashboard"),
    (r'(["\'/`])\/v1\/guide', r"\1/parts"),
]
compiled = [(re.compile(p), r) for p, r in patterns]
changed = []
for path in root.rglob("*"):
    if path.suffix not in {".ts", ".tsx"}:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    for cre, repl in compiled:
        text = cre.sub(repl, text)
    if text != orig:
        path.write_text(text, encoding="utf-8", newline="\n")
        changed.append(str(path.relative_to(root)))
print("\n".join(changed))
print("TOTAL", len(changed))
