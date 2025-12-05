export interface Slider {
  id: number;
  title: string;
  subtitle?: string;
  image: string; // الرابط اللي جاي من الباك إند
  target_link: string;
  button_text: string;
  open_in_new_tab: boolean;
  display_order: number;
}