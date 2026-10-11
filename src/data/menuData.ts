export interface MenuItem {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  price: string;
  image: string;
  video?: string;
}

export const menuData: MenuItem[] = [
  {
    id: 1,
    name: "Madras Filter Kaapi",
    subtitle: "The Davara Classic",
    description:
      "Dark decoction, hot milk and a patient pour between tumbler and davara. Frothy on top, comfort underneath.",
    price: "₹140",
    image: "/images/coffee/menu_custom_5.jpg",
  },
  {
    id: 2,
    name: "Classic Cold Coffee",
    subtitle: "Thick & Frosty",
    description:
      "The café-counter favourite: strong coffee blended with cold milk and ice, finished with a cloud of cream.",
    price: "₹180",
    image: "/images/coffee/menu_custom_1.jpg",
  },
  {
    id: 3,
    name: "Elaichi Latte",
    subtitle: "Warm Spice",
    description:
      "Espresso and steamed milk scented with crushed green cardamom and a dusting of cinnamon.",
    price: "₹190",
    image: "/images/coffee/menu_custom_3.jpg",
  },
  {
    id: 4,
    name: "Monsoon Cold Brew",
    subtitle: "Steeped Slow",
    description:
      "Cold brew steeped overnight and poured over ice. Dark and cool, like the first rain on a hot afternoon.",
    price: "₹210",
    image: "/images/coffee/menu_custom_4.jpg",
  },
  {
    id: 5,
    name: "Jaggery Latte",
    subtitle: "Gur Sweet",
    description:
      "A smooth latte sweetened with dark jaggery instead of sugar, with a deep, caramel-like finish.",
    price: "₹170",
    image: "/images/coffee/menu_psl.jpg",
  },
];
