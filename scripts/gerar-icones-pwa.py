"""Gera todos os icones do PWA da Rose a partir do logotipo oficial.

Uso: python3 scripts/gerar-icones-pwa.py
Fonte: src/assets/logo-rose-fonte.png (RGBA, fundo transparente)
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "src" / "assets" / "logo-rose-fonte.png"
COR_FUNDO = (251, 246, 240, 255)  # --color-fundo (#FBF6F0)


def compor_sobre_fundo(logo: Image.Image, tamanho: int, escala_logo: float, manter_rgba: bool = False) -> Image.Image:
    """Centraliza o logo (redimensionado por escala_logo) sobre um quadrado
    opaco de fundo #FBF6F0. escala_logo=1.0 preenche o quadrado inteiro;
    valores menores deixam margem.

    Se manter_rgba=True, retorna RGBA; senao retorna RGB (default para
    compatibilidade com formatos que nao suportam transparencia)."""
    tela = Image.new("RGBA", (tamanho, tamanho), COR_FUNDO)
    lado_logo = int(tamanho * escala_logo)
    logo_redimensionado = logo.resize((lado_logo, lado_logo), Image.LANCZOS)
    offset = ((tamanho - lado_logo) // 2, (tamanho - lado_logo) // 2)
    tela.paste(logo_redimensionado, offset, logo_redimensionado)
    if manter_rgba:
        return tela
    return tela.convert("RGB")


def main() -> None:
    logo = Image.open(FONTE).convert("RGBA")

    # Icones "any": ~10% de margem (escala 0.8 = 80% do quadrado ocupado).
    icon_192 = compor_sobre_fundo(logo, 192, 0.8)
    icon_192.save(RAIZ / "public" / "icons" / "icon-192.png")

    icon_512 = compor_sobre_fundo(logo, 512, 0.8)
    icon_512.save(RAIZ / "public" / "icons" / "icon-512.png")

    # Maskable: safe zone da spec eh circulo central de 80% do lado (40% de
    # raio) - usamos escala 0.6 pra rosa nunca encostar na borda de corte.
    icon_512_maskable = compor_sobre_fundo(logo, 512, 0.6)
    icon_512_maskable.save(RAIZ / "public" / "icons" / "icon-512-maskable.png")

    # Icone de aba do navegador (convencao app/icon.png do Next.js).
    icon_tab = compor_sobre_fundo(logo, 512, 0.8)
    icon_tab.save(RAIZ / "src" / "app" / "icon.png")

    # Apple touch icon: iOS aplica cantos arredondados sozinho, sem
    # transparencia (fundo opaco obrigatorio).
    apple_icon = compor_sobre_fundo(logo, 180, 0.78)
    apple_icon.save(RAIZ / "src" / "app" / "apple-icon.png")

    # Favicon multi-resolucao (RGBA obrigatorio para Turbopack no Next.js 16).
    favicon_base = compor_sobre_fundo(logo, 256, 0.8, manter_rgba=True)
    favicon_base.save(
        RAIZ / "src" / "app" / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (256, 256)],
    )

    print("Icones gerados a partir de", FONTE)


if __name__ == "__main__":
    main()
