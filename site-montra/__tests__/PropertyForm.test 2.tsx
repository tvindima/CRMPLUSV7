import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyForm, PropertyFormSubmit } from "../backoffice/components/PropertyForm";

describe("PropertyForm", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("bloqueia envio se faltar campos obrigatórios", async () => {
    const onSubmit = jest.fn();
    render(<PropertyForm onSubmit={onSubmit} />);

    const submit = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(submit);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/referência é obrigatória/i)).toBeInTheDocument();
  });

  it("envia payload completo quando válido", async () => {
    const onSubmit = jest.fn();
    render(<PropertyForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText(/referência/i), "REF-TEST");
    await userEvent.type(screen.getByPlaceholderText(/título/i), "Titulo");
    await userEvent.type(screen.getByPlaceholderText(/preço/i), "100000");
    await userEvent.type(screen.getByPlaceholderText(/área útil/i), "80");
    await userEvent.type(screen.getByPlaceholderText(/área terreno/i), "10");
    await userEvent.type(screen.getByPlaceholderText(/concelho/i), "Leiria");
    await userEvent.type(screen.getByPlaceholderText(/freguesia/i), "Pousos");

    const file = new File(["dummy"], "foto.jpg", { type: "image/jpeg" });
    const input = screen.getByText(/selecionar ficheiros/i).parentElement?.querySelector("input[type=file]") as HTMLInputElement;
    await userEvent.upload(input, file);

    const submit = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0] as PropertyFormSubmit;
    expect(arg.payload.reference).toBe("REF-TEST");
    expect(arg.files[0].name).toBe("foto.jpg");
  });
});
