# 📌 Meus Favoritos Pro

Gerenciador inteligente de favoritos com organização, atalhos e backup.

## ✨ Funcionalidades

- 📂 **Organização por categorias** — Links agrupados por tema
- 📌 **Favoritos fixados** — Acesso rápido com atalhos Ctrl+1 a Ctrl+5
- 🔍 **Busca inteligente** — Pesquise por nome, texto ou tags (`tag:email`)
- 📊 **Contador de cliques** — Saiba quais links você mais acessa
- 🌗 **Temas** — Claro, escuro e automático (segue o sistema)
- 🖱️ **Drag & Drop** — Reordene links e categorias arrastando
- 💾 **Exportar/Importar** — Backup completo em JSON
- 🔒 **Conteúdo sensível** — Seção que pode ser ocultada/exibida
- 📱 **PWA** — Instalável como app, funciona offline
- ⌨️ **Atalhos de teclado** — `Ctrl+K` (busca), `D` (tema), `E` (exportar), `S` (config)

## 🚀 Como Usar

### Opção 1: GitHub Pages (Recomendado)
1. Faça fork deste repositório
2. Acesse `https://seuusuario.github.io/favQWEN3-main/`

### Opção 2: Local
1. Abra o arquivo `index.html` no navegador
2. Ou use um servidor local:
   ```bash
   npx serve .
   ```

## 📁 Estrutura

```
├── index.html      # Página principal
├── styles.css      # Estilos (temas claro/escuro)
├── app.js          # Lógica da aplicação
├── sw.js           # Service Worker (offline/PWA)
└── manifest.json   # Configuração PWA
```

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Ctrl+K` | Focar busca |
| `Ctrl+1-5` | Abrir favoritos fixados |
| `D` | Alternar tema |
| `E` | Exportar backup |
| `S` | Abrir configurações |
| `Esc` | Limpar busca |

## 🔧 Personalização

Edite o `index.html` para adicionar seus próprios links nas categorias. Cada link suporta:
- `data-url` — URL do favorito
- `data-name` — Nome exibido
- `data-tags` — Tags para busca (separadas por vírgula)

## 📝 Licença

MIT — Use livremente!
