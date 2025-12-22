import "@testing-library/jest-dom";

// jsdom não implementa createObjectURL; mock simples para componentes de upload
if (!(global as any).URL.createObjectURL) {
  (global as any).URL.createObjectURL = () => "blob:mock";
}
if (!(global as any).URL.revokeObjectURL) {
  (global as any).URL.revokeObjectURL = () => {};
}
