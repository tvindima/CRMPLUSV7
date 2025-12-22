import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "../backoffice/components/DataTable";

describe("DataTable", () => {
  it("chama callback quando ação é clicada", () => {
    const onAction = jest.fn();
    render(
      <DataTable
        columns={["Ref"]}
        rows={[["R1"], ["R2"]]}
        actions={["Editar"]}
        onAction={onAction}
      />
    );

    const buttons = screen.getAllByText("Editar");
    fireEvent.click(buttons[1]);

    expect(onAction).toHaveBeenCalledWith("Editar", 1);
  });
});
