export interface GalleryItem {
  id: number;
  src: string;
  alt: string;
  category: string;
  span?: string; // tailwind col/row span class
}

export const galleryData: GalleryItem[] = [
  { id: 1, src: "/images/coffee/gallery_custom_1.jpg", alt: "Iced milk coffee swirling in a tall glass", category: "Cold" },
  { id: 2, src: "/images/coffee/gallery_macchiato.jpg", alt: "A busy café with warm pendant lights", category: "Café" },
  { id: 3, src: "/images/coffee/gallery_latte.jpg", alt: "Iced espresso catching afternoon sun", category: "Cold" },
  { id: 4, src: "/images/coffee/gallery_hotcup.jpg", alt: "Two cups of latte art on a wooden table", category: "Hot" },
  { id: 5, src: "/images/coffee/gallery_americano.jpg", alt: "A cup of black coffee seen from above", category: "Black" },
  { id: 6, src: "/images/coffee/gallery_custom_2.jpg", alt: "Heart-shaped latte art in a white cup", category: "Hot" },
];
