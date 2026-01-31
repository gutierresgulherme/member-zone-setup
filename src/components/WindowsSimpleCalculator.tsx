import { useMemo, useState } from "react";

type Op = "+" | "-" | "*" | "/";

function isOp(ch: string): ch is Op {
  return ch === "+" || ch === "-" || ch === "*" || ch === "/";
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "Erro";
  const str = String(n);
  // Avoid very long floats.
  if (str.includes("e") || str.length <= 14) return str;
  return n.toPrecision(12).replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
}

/**
 * Safe evaluator for expressions containing only numbers and + - * / .
 * No parentheses, no functions, no identifiers.
 */
function evaluateExpression(expr: string): number {
  const trimmed = expr.replace(/\s+/g, "");
  if (!trimmed) return 0;

  // Tokenize.
  const tokens: Array<number | Op> = [];
  let i = 0;

  const readNumber = () => {
    let j = i;
    let seenDot = false;
    if (trimmed[j] === ".") {
      seenDot = true;
      j++;
    }
    while (j < trimmed.length) {
      const c = trimmed[j];
      if (c >= "0" && c <= "9") {
        j++;
        continue;
      }
      if (c === "." && !seenDot) {
        seenDot = true;
        j++;
        continue;
      }
      break;
    }
    const raw = trimmed.slice(i, j);
    if (raw === ".") throw new Error("invalid");
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error("invalid");
    i = j;
    return n;
  };

  while (i < trimmed.length) {
    const c = trimmed[i];
    const prev = tokens[tokens.length - 1];

    // Allow unary minus only at start or after an operator.
    if (c === "-" && (tokens.length === 0 || typeof prev !== "number")) {
      i++; // consume '-'
      const n = readNumber();
      tokens.push(-n);
      continue;
    }

    if ((c >= "0" && c <= "9") || c === ".") {
      tokens.push(readNumber());
      continue;
    }
    if (isOp(c)) {
      // Disallow two operators in a row (except handled unary minus above).
      if (tokens.length === 0 || typeof prev !== "number") throw new Error("invalid");
      tokens.push(c);
      i++;
      continue;
    }

    throw new Error("invalid");
  }

  // Expression must end with a number.
  if (typeof tokens[tokens.length - 1] !== "number") throw new Error("invalid");

  const precedence: Record<Op, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const output: Array<number | Op> = [];
  const ops: Op[] = [];

  for (const t of tokens) {
    if (typeof t === "number") {
      output.push(t);
    } else {
      while (ops.length && precedence[ops[ops.length - 1]] >= precedence[t]) {
        output.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) output.push(ops.pop()!);

  const stack: number[] = [];
  for (const t of output) {
    if (typeof t === "number") {
      stack.push(t);
      continue;
    }
    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) throw new Error("invalid");
    switch (t) {
      case "+":
        stack.push(a + b);
        break;
      case "-":
        stack.push(a - b);
        break;
      case "*":
        stack.push(a * b);
        break;
      case "/":
        stack.push(a / b);
        break;
    }
  }

  if (stack.length !== 1) throw new Error("invalid");
  return stack[0];
}

function normalizeOpLabel(label: string): Op {
  if (label === "÷") return "/";
  if (label === "×") return "*";
  return label as Op;
}

function getLastNumberSegment(expr: string): string {
  // Returns the substring after the last operator.
  for (let i = expr.length - 1; i >= 0; i--) {
    const c = expr[i];
    if (c === "+" || c === "*" || c === "/") return expr.slice(i + 1);
    if (c === "-") {
      // minus can be unary: treat as operator only if there's a number before it
      return expr.slice(i + 1);
    }
  }
  return expr;
}

export default function WindowsSimpleCalculator() {
  const [expr, setExpr] = useState<string>("");
  const [display, setDisplay] = useState<string>("0");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const buttons = useMemo(
    () => [
      { label: "C", kind: "action" as const },
      { label: "⌫", kind: "action" as const },
      { label: "÷", kind: "op" as const },
      { label: "7", kind: "digit" as const },
      { label: "8", kind: "digit" as const },
      { label: "9", kind: "digit" as const },
      { label: "×", kind: "op" as const },
      { label: "4", kind: "digit" as const },
      { label: "5", kind: "digit" as const },
      { label: "6", kind: "digit" as const },
      { label: "-", kind: "op" as const },
      { label: "1", kind: "digit" as const },
      { label: "2", kind: "digit" as const },
      { label: "3", kind: "digit" as const },
      { label: "+", kind: "op" as const },
      { label: "0", kind: "digit" as const, wide: true },
      { label: ".", kind: "digit" as const },
      { label: "=", kind: "equals" as const },
    ],
    [],
  );

  const pushDigit = (d: string) => {
    setExpr((prev) => {
      const nextBase = justEvaluated ? "" : prev;
      const next = nextBase + d;

      // Prevent multiple dots in the current number segment.
      if (d === ".") {
        const seg = getLastNumberSegment(nextBase);
        if (seg.includes(".")) return nextBase;
        if (seg === "" || seg === "-") return nextBase + "0.";
      }

      setJustEvaluated(false);
      setDisplay(getLastNumberSegment(next) || "0");
      return next;
    });
  };

  const pushOp = (opLabel: string) => {
    const op = normalizeOpLabel(opLabel);
    setExpr((prev) => {
      const base = justEvaluated ? display.replace("Erro", "0") : prev;
      setJustEvaluated(false);

      if (!base) return op === "-" ? "-" : "";

      const last = base[base.length - 1];
      if (isOp(last)) {
        // Replace last operator (except allow "-" unary by keeping it).
        const replaced = base.slice(0, -1) + op;
        setDisplay(opLabel);
        return replaced;
      }

      setDisplay(opLabel);
      return base + op;
    });
  };

  const backspace = () => {
    setExpr((prev) => {
      const base = justEvaluated ? "" : prev;
      const next = base.slice(0, -1);
      const seg = getLastNumberSegment(next);
      setDisplay(seg || "0");
      setJustEvaluated(false);
      return next;
    });
  };

  const clear = () => {
    setExpr("");
    setDisplay("0");
    setJustEvaluated(false);
  };

  const equals = () => {
    try {
      const value = evaluateExpression(expr);
      const formatted = formatNumber(value);
      setDisplay(formatted);
      setExpr(formatted === "Erro" ? "" : formatted);
      setJustEvaluated(true);
    } catch {
      setDisplay("Erro");
      setExpr("");
      setJustEvaluated(true);
    }
  };

  const onPress = (label: string, kind: string) => {
    if (kind === "digit") return pushDigit(label);
    if (kind === "op") return pushOp(label);
    if (kind === "equals") return equals();
    if (label === "⌫") return backspace();
    return clear();
  };

  return (
    <section className="w-full max-w-sm">
      <div className="rounded-xl border bg-card shadow-sm">
        <header className="border-b px-4 py-3">
          <div className="text-xs text-muted-foreground">Calculadora</div>
          <div
            className="mt-2 select-none text-right text-4xl font-semibold tabular-nums tracking-tight"
            aria-label="Visor"
          >
            {display}
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground" aria-label="Expressão">
            {expr || " "}
          </div>
        </header>

        <div className="grid grid-cols-4 gap-2 p-3">
          {buttons.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => onPress(b.label, b.kind)}
              className={
                "h-12 rounded-lg border bg-background text-sm font-medium transition " +
                "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                "active:translate-y-[1px] active:shadow-none" +
                (b.wide ? " col-span-2" : "")
              }
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
