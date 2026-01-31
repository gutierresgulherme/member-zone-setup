import WindowsSimpleCalculator from "@/components/WindowsSimpleCalculator";

const Index = () => (
  <main className="min-h-screen bg-background">
    <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
      <div className="w-full">
        <h1 className="sr-only">Calculadora simples</h1>
        <WindowsSimpleCalculator />
      </div>
    </div>
  </main>
);

export default Index;
