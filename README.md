# MeuGerente — Restaurant OS (Europa / HoReCa)

Sistema Operacional moderno para bares e restaurantes europeus com suporte nativo a Euro (€), alérgenos UE, taxas de IVA, cardápio digital via QR Code, app móvel de bolso para garçons/empregados de mesa, tela de cozinha KDS e ponto de venda (PDV).

## 🚀 Arquitetura e Tecnologias
- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide Icons
- **Backend & Banco de Dados:** Google Cloud / Firebase (Firestore Realtime + Firebase Authentication)
- **Hospedagem:** Firebase Hosting (`https://meuqueridogerente.web.app`)
- **Padrão:** Clean Domain-Driven Architecture (camadas isoladas: `domain`, `services`, `hooks`, `components`)

## 🛠️ Comandos Principais
- `npm run dev`: Inicia o servidor local de desenvolvimento.
- `npm run build`: Compila a aplicação para produção.
- `npm run deploy`: Realiza o deploy das regras do Firestore e da hospedagem no Firebase.
