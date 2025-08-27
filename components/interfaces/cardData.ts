export default interface CardData {
  id: string;
  x: number;
  y: number;
  type: "text" | "image" | "video";
  content: string; // URL for image/video, text for text
}