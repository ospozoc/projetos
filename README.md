# Doce Pé Peknin
Site estático em Astro, TypeScript e CSS para uma fábrica de calçados infantis. Catálogo com filtros, detalhes de cada referência, sacola com quantidades e consulta manual pelo WhatsApp.

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
Executa checagem de tipos, testes Playwright em desktop e celular e build estático. Os testes usam Chromium em `/usr/bin/chromium`; em outra máquina, defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o navegador instalado. O servidor de testes é iniciado em primeiro plano na porta 4322, sem reaproveitar servidores existentes. Telemetria Astro desativada para execução em ambientes restritos.

Os testes cobrem catálogo, filtros, links, teclado, abertura e fechamento de detalhes, quantidades e remoção na sacola, persistência após recarga, mensagem de consulta, perguntas frequentes, ausência de erros JS e carregamento sem serviços externos.

`npm run build` gera `dist/`; `npm run preview` permite revisar o build. Fontes e imagens são locais. Não há banco ou segredos.

## Abrir sem instalar nada
```sh
npm run export:preview
```
Gera `/workspace/doce-pe-peknin-abrir.html`: um HTML único com estilos, fontes, scripts e imagens embutidos. Baixe e abra esse arquivo no navegador de seu computador para navegar pelo catálogo, detalhes e sacola. Links de contato abrem WhatsApp/telefone e precisam dos respectivos aplicativos ou acesso à internet.

A exportação foi feita para apresentação local, sem substituir o build de produção. O navegador gerenciado deste ambiente bloqueia navegação `file://`; a interatividade do HTML autossuficiente é validada injetando seu conteúdo no Chromium, com os mesmos scripts e recursos embutidos.

## Conteúdo e imagens
Edite `src/data/products.ts` para o catálogo. Os itens atuais são demonstrativos: nomes, cores e fotografias sintéticas não representam produtos confirmados da empresa. A origem gerada por IA é informada na página, nos detalhes e nas perguntas frequentes. Substitua por fotos e informações reais aprovadas antes do uso comercial.

`public/images/catalogo.png` é uma composição de quatro imagens ilustrativas geradas por IA e exibidas por recorte CSS. A arte foi solicitada como referências de calçados infantis sem logotipo. As imagens antigas em SVG não são usadas no layout atual. Tipografia local: DM Sans e Fraunces, distribuídas pelos pacotes Fontsource.

A sacola guarda apenas identificadores dos modelos e quantidades no armazenamento local do navegador. Nenhum dado pessoal é coletado. Se o navegador não permitir armazenamento, ela funciona durante a navegação atual. O site prepara a mensagem para o cliente revisar e enviar no WhatsApp: não existe checkout, reserva ou confirmação de compra.

## Publicação no GitHub Pages
O build para o repositório `ospozoc/projetos` usa o caminho `/projetos/`:

```sh
npm run build:pages
```
Gera `/workspace/doce-pe-pages-dist`, separado do build raiz. Os valores opcionais `DEPLOY_BASE` e `DEPLOY_SITE` também permitem outros destinos sem alterar o layout ou o build padrão.

A branch `gh-pages` é reservada para os arquivos gerados e deve incluir `.nojekyll`. Para ativar a hospedagem no GitHub, abra:
https://github.com/ospozoc/projetos/settings/pages

Em **Build and deployment**, selecione **Deploy from a branch**, branch **gh-pages**, pasta **/(root)** e clique em **Save**. O endereço previsto é https://ospozoc.github.io/projetos/ ; só considere publicado após confirmar o endereço e o deploy concluído. A disponibilidade do Pages depende das permissões e do plano da conta. Não alterar a visibilidade do repositório ou contratar plano automaticamente.

A rede deste ambiente bloqueia `api.github.com`, impedindo ativar o Pages pela API. O Git HTTPS permite leitura e envio ao repositório conectado. O acesso ao domínio público de Pages também não está liberado na política de rede atual, portanto a verificação externa depende de liberação dessa rede ou de acesso pelo navegador do usuário.

O build raiz `dist/` e o ZIP `/workspace/doce-pe-peknin-site.zip` continuam próprios para hospedagem na raiz, como Netlify. Não há banco, servidor ou variável secreta para configurar.

## Instruções
Veja AGENTS.md e BRIEF.md. Não é necessário Neon ou Resend nesta fase.

## Resultado desta revisão
Verificado: 8 testes Playwright passaram nos tamanhos desktop e celular; checagem de tipos sem erros, avisos ou hints; build estático concluído. A cópia HTML foi testada no Chromium com filtros, detalhes, quantidades e consulta pelo WhatsApp, sem requests HTTP para carregar a interface. Publicação externa e fotos reais continuam pendentes.
