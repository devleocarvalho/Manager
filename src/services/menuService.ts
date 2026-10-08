import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { MenuItem } from "../domain/types";

export const DEFAULT_EURO_MENU: MenuItem[] = [
  { id: "1", name: "Smash Burger Duplo", price: 9.50, category: "pratos", description: "2x carnes bovinas 90g, queijo cheddar derretido e molho da casa.", popular: true, vatRate: 13, allergens: ["Glúten", "Lactose"] },
  { id: "2", name: "Mega Bacon Crispy", price: 12.00, category: "pratos", description: "Pão brioche, blend 160g, muito bacon e maionese defumada.", popular: true, vatRate: 13, allergens: ["Glúten", "Lactose"] },
  { id: "3", name: "Francesinha Especial", price: 13.50, category: "pratos", description: "Molho tradicional picante, carnes selecionadas, queijo gratinado e ovo.", popular: true, vatRate: 13, allergens: ["Glúten", "Lactose", "Ovos"] },
  { id: "4", name: "Batata Frita Rústica", price: 4.50, category: "entradas", description: "Crocantes por fora, macias por dentro com páprica doce.", vatRate: 13 },
  { id: "5", name: "Asinhas de Frango Picantes", price: 7.00, category: "entradas", description: "Molho barbecue picante artesanal (6 unidades).", vatRate: 13 },
  { id: "6", name: "Cerveja Imperial / Fino 300ml", price: 2.20, category: "bebidas", description: "Pressão bem gelada.", popular: true, vatRate: 23, allergens: ["Glúten"] },
  { id: "7", name: "Taça Vinho Regional Douro", price: 3.50, category: "bebidas", description: "Tinto ou Branco da casa.", vatRate: 23 },
  { id: "8", name: "Água Mineral 500ml", price: 1.50, category: "bebidas", description: "Com ou sem gás.", vatRate: 6 },
  { id: "9", name: "Refrigerante Lata 330ml", price: 2.20, category: "bebidas", description: "Coca-cola, Guaraná, Ice Tea ou Fanta.", vatRate: 23 },
  { id: "10", name: "Café Expresso / Bica", price: 1.00, category: "bebidas", description: "Grão selecionado torra média.", vatRate: 13 },
  { id: "11", name: "Pastel de Nata Artesanal", price: 2.50, category: "sobremesas", description: "Massa folhada estaladiça com recheio cremoso e canela.", popular: true, vatRate: 13, allergens: ["Glúten", "Lactose", "Ovos"] },
];

export const menuService = {
  subscribeMenu(tenantId: string, onUpdate: (items: MenuItem[]) => void) {
    if (!tenantId) {
      onUpdate(DEFAULT_EURO_MENU);
      return () => {};
    }

    const q = query(collection(db, "technical_sheets"), where("tenant_id", "==", tenantId));
    return onSnapshot(q, (snapshot) => {
      const custom: MenuItem[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: `sheet-${d.id}`,
          name: data.menuItemName,
          price: Number(data.salePrice) || 10.00,
          category: data.category || "pratos",
          description: data.description || "Prato especial da casa.",
          vatRate: data.vatRate || 13,
          allergens: data.allergens || [],
          popular: true
        };
      });

      const customNames = new Set(custom.map(c => c.name.toLowerCase()));
      const filteredDefaults = DEFAULT_EURO_MENU.filter(d => !customNames.has(d.name.toLowerCase()));
      onUpdate([...custom, ...filteredDefaults]);
    }, () => {
      onUpdate(DEFAULT_EURO_MENU);
    });
  }
};
