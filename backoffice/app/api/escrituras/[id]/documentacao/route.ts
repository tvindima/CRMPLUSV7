import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, serverApiPatchNoBody } from "@/lib/server-api";

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/escrituras/[id]/documentacao - Update escritura documentation status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const pronta = searchParams.get('pronta');
    const notas = searchParams.get('notas');
    
    if (pronta === null) {
      return NextResponse.json({ error: "Parâmetro 'pronta' é obrigatório" }, { status: 400 });
    }

    let endpoint = `/escrituras/${id}/documentacao?pronta=${pronta}`;
    if (notas) {
      endpoint += `&notas=${encodeURIComponent(notas)}`;
    }

    const res = await serverApiPatchNoBody(endpoint, token);

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: error || "Erro ao atualizar documentação" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Escritura Documentacao PATCH] Exception:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
