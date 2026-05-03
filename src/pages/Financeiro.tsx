import { useState, useMemo } from "react";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Lancamento {
  id: string;
  data: string;
  paciente: string;
  cpf: string;
  faturamento: number;
  entrada: number;
  taxas: number;
  valorLiq: number;
  saida: number;
  pagamento: string;
  produto: string;
}

// Empty for now — will be filled from DB later
const lancamentosMock: Lancamento[] = [];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pagamentoBadge = (tipo: string) => {
  const map: Record<string, string> = {
    Pix: "bg-palette-green/10 text-palette-green border-palette-green/20",
    Crédito: "bg-palette-red/10 text-palette-red border-palette-red/20",
    Débito: "bg-palette-blue/10 text-palette-blue border-palette-blue/20",
    Dinheiro: "bg-palette-amber/10 text-palette-amber border-palette-amber/20",
  };
  return map[tipo] || "bg-muted text-muted-foreground";
};

export default function Financeiro() {
  const [mesAtivo, setMesAtivo] = useState(new Date().getMonth());

  const dados = useMemo(
    () => lancamentosMock.filter((l) => {
      const d = new Date(l.data);
      return d.getMonth() === mesAtivo;
    }),
    [mesAtivo],
  );

  const totais = useMemo(() => {
    return dados.reduce(
      (acc, l) => ({
        faturamento: acc.faturamento + l.faturamento,
        entrada: acc.entrada + l.entrada,
        taxas: acc.taxas + l.taxas,
        valorLiq: acc.valorLiq + l.valorLiq,
        saida: acc.saida + l.saida,
        lucro: acc.lucro + (l.valorLiq - l.saida),
      }),
      { faturamento: 0, entrada: 0, taxas: 0, valorLiq: 0, saida: 0, lucro: 0 },
    );
  }, [dados]);

  const emptyRows = Math.max(0, 15 - dados.length);

  return (
    <div className="page-shell mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3"><DollarSign className="h-6 w-6 text-primary" /><h1 className="page-title">Planilha Financeira</h1></div>
      </div>

      {/* Summary cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Faturamento", value: totais.faturamento },
          { label: "Entrada", value: totais.entrada },
          { label: "Taxas", value: totais.taxas },
          { label: "Valor Líq.", value: totais.valorLiq },
          { label: "Saída", value: totais.saida, red: true },
          { label: "Lucro", value: totais.lucro },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              c.red ? "text-palette-red" : "text-muted-foreground",
            )}>
              {c.label}
            </p>
            <p className={cn(
              "mt-1 text-lg font-bold tabular-nums",
              c.red ? "text-palette-red" : "text-foreground",
            )}>
              {fmt(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Month tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {MESES.map((m, i) => (
          <button
            key={m}
            onClick={() => setMesAtivo(i)}
            className={cn(
              "shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors",
              i === mesAtivo
                ? "border border-b-0 border-border bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              <TableHead className="w-[100px] font-bold text-primary-foreground">DATA</TableHead>
              <TableHead className="min-w-[160px] font-bold text-primary-foreground">PACIENTE</TableHead>
              <TableHead className="min-w-[130px] font-bold text-primary-foreground">CPF</TableHead>
              <TableHead className="text-right font-bold text-primary-foreground">FATURAMENTO</TableHead>
              <TableHead className="text-right font-bold text-primary-foreground">ENTRADA</TableHead>
              <TableHead className="text-right font-bold text-primary-foreground">TAXAS</TableHead>
              <TableHead className="text-right font-bold text-primary-foreground">VALOR LÍQ.</TableHead>
              <TableHead className="text-right font-bold text-primary-foreground">SAÍDA</TableHead>
              <TableHead className="min-w-[110px] font-bold text-primary-foreground">PAGAMENTO</TableHead>
              <TableHead className="min-w-[120px] font-bold text-primary-foreground">PRODUTO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="tabular-nums text-muted-foreground">{l.data}</TableCell>
                <TableCell>{l.paciente}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{l.cpf}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(l.faturamento)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(l.entrada)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(l.taxas)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(l.valorLiq)}</TableCell>
                <TableCell className="text-right tabular-nums text-palette-red">{fmt(l.saida)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[11px]", pagamentoBadge(l.pagamento))}>
                    {l.pagamento}
                  </Badge>
                </TableCell>
                <TableCell>{l.produto}</TableCell>
              </TableRow>
            ))}
            {/* Empty rows to mimic spreadsheet feel */}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                <TableCell>&nbsp;</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell>
                  {i < 2 && dados.length === 0 && (
                    <div className="h-4 w-16 rounded bg-muted/60" />
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Registre receitas e despesas para visualizar relatórios.
      </p>
    </div>
  );
}
