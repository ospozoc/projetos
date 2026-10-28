# Doce Pé Peknin
Site estático em Astro, TypeScript e CSS para a fábrica de calçados infantis. Layout inspirado no catálogo fornecido pelo usuário, coleção Primavera • Verão, com fotos e logotipos originais.

Site: https://ospozoc.github.io/projetos/

## Executar
Node.js 22.12 ou superior (validado com 24.19.0), npm 11.

```sh
cd /workspace/projetos
npm ci
npm run dev
```

## Verificar
```sh
npm run verify
```
Executa checagem de tipos, testes Playwright em desktop e celular e build estático. Cobertura: filtros, busca e ausência de resultados; detalhes/ref/numeração; sacola/quantidades/persistência; consulta pelo WhatsApp; teclado; imagens/fontes locais e ausência de rolagem horizontal em 390 e 320 px.

O navegador de teste padrão é `/usr/bin/chromium`. Em outra máquina, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o Chromium instalado. O servidor de teste é iniciado em primeiro plano na porta 4322; não reutiliza servidores existentes. Telemetria Astro desativada para permitir execução em ambientes restritos.

`npm run build` gera `dist/`; `npm run preview` permite revisar o build. Sem banco ou credenciais. Fontes locais: Poppins e Nunito, distribuídas via Fontsource.

## Catálogo e origem das imagens
`public/catalogo/products.json` contém 16 referências selecionadas do arquivo **Doce Pé Julho 2026br.pdf**. `src/data/products.ts` define tipos, categorias e caminhos compatíveis com hospedagem na raiz ou em subdiretório.

As fotosJPEG foram extraídas diretamente das imagens embutidas no PDF, sem geração de imagens ou retoques. A numeração e as cores vêm das legendas. Os nomes descritivos combinam categoria e código; não inventam nomes comerciais. `public/catalogo/provenance.json` registra as páginas e os objetos de origem para conferência.

O logotipo Doce Pé foi extraído como imagem separada. O logotipo Peknin foi renderizado da região correspondente à capa, preservando seu fundo original. As marcas aparecem separadas na capa, e todos os modelos selecionados são identificados como Doce Pé nas páginas de produto.

O PDF completo e a contracapa não são publicados. O telefone fornecido pelo usuário, +55 11 94275-6602, tem precedência sobre qualquer outro contato no documento.

Para repetir a extração, é necessário o PDF original e Python com PyMuPDF instalado:

```sh
python scripts/extract-catalogue.py /caminho/para/catalogo.pdf
```

Catálogo de julho 2026 não garante disponibilidade atual. Não há preços, estoque, prazo ou entrega inventados: a consulta é feita diretamente com a fábrica.

## Sacola
Guarda apenas identificadores e quantidades no armazenamento local do navegador. Sem dados pessoais. Se o navegador bloquear armazenamento, a página continua funcionando na sessão atual. Modelos da demonstração antiga não são migrados para referências reais.

A mensagem contém referência, cor, quantidade e numeração indicada no catálogo. O cliente revisa e envia pelo WhatsApp; o site não reserva produtos, confirma compras ou recebe pagamentos.

## Versão para abrir sem instalar
```sh
npm run export:preview
```
Gera `/workspace/doce-pe-peknin-abrir.html`, com CSS, fontes, imagens e scripts embutidos. Baixe e abra no navegador do computador. A cópia deve manter imagens também após abrir detalhes ou adicionar à sacola. Os links de WhatsApp/telefone dependem do respectivo aplicativo ou internet.

O navegador gerenciado bloqueia `file://`; a exportação é validada com o conteúdo exato via `page.setContent` no Chromium, sem servidor ou requisições HTTP para carregar a interface.

## Publicar no GitHub Pages
```sh
npm run build:pages
```
Gera `/workspace/doce-pe-pages-dist` com `DEPLOY_BASE=/projetos/` e `DEPLOY_SITE=https://ospozoc.github.io`, sem alterar o build raiz. Envie o conteúdo gerado à branch `gh-pages`, incluindo `.nojekyll`. Preserve o histórico e arquivos de configuração da hospedagem que não pertençam ao build. Não usar force push.

A hospedagem já foi ativada pelo usuário para **gh-pages → /(root)**. A primeira publicação foi confirmada na execução https://github.com/ospozoc/projetos/actions/runs/40752030473 . Para novas versões, confirme o resultado da nova execução na página pública deActions: https://github.com/ospozoc/projetos/actions .

A rede deste ambiente permite Git HTTPS e o site público do GitHub, mas bloqueia `api.github.com` e o domínio do Pages. Uma conclusão de deploy no GitHub é evidência de publicação, sem equivaler a uma requisiçãoHTTP externa do site a partir deste ambiente.

Consulte AGENTS.md e BRIEF.md para os limites e as decisões do projeto.

## Verificação da revisão do catálogo
10 testes funcionais passaram nos tamanhos desktop e celular. Após ajustar o nome acessível do link de WhatsApp no cabeçalho mobile, os 2 testes de teclado/contato afetados passaram novamente. Checagem de tipos: zero erros, avisos e hints. Builds na raiz e em `/projetos/` concluídos.

A cópia autossuficiente foi verificada com todos os 16 detalhes e suas fotos, 16 miniaturas na sacola, filtros, busca, quantidades e referências na mensagem, sem requisições HTTP ou erros de JavaScript. As versões web e portátil foram conferidas em 390 e 320 px, sem rolagem horizontal.

## Publicação desta revisão
Atualização do layout e catálogo enviada a `main` e `gh-pages`, com histórico preservado. O GitHub confirmou a publicação com sucesso na execução https://github.com/ospozoc/projetos/actions/runs/40756115014 . O endereço permanece https://ospozoc.github.io/projetos/ .
