import { Suspense } from "react";
import { format } from "date-fns";
import { Funnel } from "lucide-react";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormPanelSkeleton,
  ListSkeleton,
  PanelSkeleton,
} from "@/components/ui/section-skeletons";
import { getReferenceData } from "@/services/reference";
import { getTransactionById, getTransactions } from "@/services/transactions";

interface TransactionsPageProps {
  searchParams: Promise<{
    month?: string;
    category?: string;
    account?: string;
    type?: "income" | "expense";
    status?: "paid" | "pending" | "scheduled";
    edit?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const month = params.month ?? format(new Date(), "yyyy-MM");
  const referencePromise = getReferenceData();
  const statementsPromise = getTransactions({
    month,
    categoryId: params.category,
    accountId: params.account,
    type: params.type,
    status: params.status,
  });
  const editablePromise = params.edit ? getTransactionById(params.edit) : Promise.resolve(null);

  return (
    <div className="space-y-5">
      <Suspense fallback={<FormPanelSkeleton fields={8} />}>
        <TransactionFormSection referencePromise={referencePromise} editablePromise={editablePromise} />
      </Suspense>

      <Suspense fallback={<TransactionFiltersFallback />}>
        <TransactionFiltersSection month={month} params={params} referencePromise={referencePromise} />
      </Suspense>

      <Suspense fallback={<ListSkeleton total={5} />}>
        <TransactionListSection statementsPromise={statementsPromise} />
      </Suspense>
    </div>
  );
}

async function TransactionFormSection({
  referencePromise,
  editablePromise,
}: {
  referencePromise: ReturnType<typeof getReferenceData>;
  editablePromise: ReturnType<typeof getTransactionById>;
}) {
  const [{ accounts, categories }, editable] = await Promise.all([referencePromise, editablePromise]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{editable ? "Edit Transaction" : "Create Transaction"}</CardTitle>
        <p className="text-sm text-muted-foreground">Capture income, expenses, installments, and due dates with touch-friendly fields.</p>
      </CardHeader>
      <CardContent>
        <TransactionForm accounts={accounts} categories={categories} transaction={editable ?? undefined} />
      </CardContent>
    </Card>
  );
}

async function TransactionFiltersSection({
  month,
  params,
  referencePromise,
}: {
  month: string;
  params: {
    month?: string;
    category?: string;
    account?: string;
    type?: "income" | "expense";
    status?: "paid" | "pending" | "scheduled";
    edit?: string;
  };
  referencePromise: ReturnType<typeof getReferenceData>;
}) {
  const { accounts, categories } = await referencePromise;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2">
          <Funnel className="h-4 w-4 text-muted-foreground" />
          Filters
        </CardTitle>
        <p className="text-sm text-muted-foreground">Refine the list without squeezing multiple controls into a single row on mobile.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm" type="month" name="month" defaultValue={month} />
          <select className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm" name="category" defaultValue={params.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm" name="account" defaultValue={params.account ?? ""}>
            <option value="">All accounts</option>
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm" name="type" defaultValue={params.type ?? ""}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="h-11 rounded-2xl border border-border bg-card/70 px-4 text-sm" name="status" defaultValue={params.status ?? ""}>
            <option value="">All status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <button className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground md:col-span-2 xl:col-span-5" type="submit">
            Apply filters
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

async function TransactionListSection({
  statementsPromise,
}: {
  statementsPromise: ReturnType<typeof getTransactions>;
}) {
  const statements = await statementsPromise;
  return <TransactionList statements={statements} />;
}

function TransactionFiltersFallback() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2">
          <Funnel className="h-4 w-4 text-muted-foreground" />
          Filters
        </CardTitle>
        <p className="text-sm text-muted-foreground">Refine the list without squeezing multiple controls into a single row on mobile.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-11 rounded-2xl bg-muted/70" />
          ))}
          <div className="h-11 rounded-2xl bg-muted/70 md:col-span-2 xl:col-span-5" />
        </div>
      </CardContent>
    </Card>
  );
}
