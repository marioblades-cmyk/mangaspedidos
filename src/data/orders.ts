export interface Order {
  id: number;
  titulo: string;
  tipo: string;
  precioVendido: number | null;
  precioRegular: number | null;
  pago: number | null;
  saldo: number | null;
  numero: string;
  estado: string;
  nota: string;
}

export type EstadoType = "SEPARADO" | "PEDIDO 9" | "PEDIDO 10" | "PEDIDO 11" | "PEDIDO 21" | "NO CLASIFICA" | "CAMBIO" | "";

export const ordersData: Order[] = [
  { id: 1, titulo: "ADOLF", tipo: "RESERVA", precioVendido: 900, precioRegular: 900, pago: 700, saldo: 200, numero: "60647002", estado: "SEPARADO", nota: "" },
  { id: 2, titulo: "ASÍ HABLÓ KISHIBE ROHAN 3", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 76.5, saldo: 0, numero: "71610729", estado: "PEDIDO 10", nota: "" },
  { id: 3, titulo: "ATAQUE A LOS TITANES 01", tipo: "", precioVendido: 190, precioRegular: null, pago: 100, saldo: 90, numero: "70216157", estado: "SEPARADO", nota: "" },
  { id: 4, titulo: "BAKI THE GRAPPLER KANZENBAN 11", tipo: "PRE VENTA", precioVendido: 193.5, precioRegular: null, pago: 100, saldo: 93.5, numero: "77172292", estado: "SEPARADO", nota: "" },
  { id: 5, titulo: "BLOOD ON THE TRACKS 12", tipo: "CAMBIO", precioVendido: null, precioRegular: null, pago: null, saldo: null, numero: "77331983", estado: "", nota: "" },
  { id: 6, titulo: "BLUE LOCK 19", tipo: "", precioVendido: null, precioRegular: null, pago: null, saldo: null, numero: "TAKA TAKA", estado: "PEDIDO 10", nota: "" },
  { id: 7, titulo: "BLUE LOCK 27", tipo: "RESERVA", precioVendido: 67.5, precioRegular: 75, pago: 0, saldo: 67.5, numero: "77331983", estado: "", nota: "" },
  { id: 8, titulo: "BOLSAS 1 TANKO Y 4 A5", tipo: "", precioVendido: null, precioRegular: null, pago: null, saldo: null, numero: "", estado: "SEPARADO", nota: "" },
  { id: 9, titulo: "CALL OF THE NIGHT 17", tipo: "", precioVendido: 72, precioRegular: null, pago: 36, saldo: 36, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 10, titulo: "CALL OF THE NIGHT 18", tipo: "", precioVendido: 72, precioRegular: null, pago: 36, saldo: 36, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 11, titulo: "CHAINSAW MAN 19", tipo: "", precioVendido: 70, precioRegular: null, pago: 10, saldo: 60, numero: "74183419", estado: "PEDIDO 10", nota: "" },
  { id: 12, titulo: "CHAINSAW MAN 20", tipo: "", precioVendido: 70, precioRegular: null, pago: 10, saldo: 60, numero: "74183419", estado: "PEDIDO 10", nota: "" },
  { id: 13, titulo: "CHAINSAW MAN 21", tipo: "", precioVendido: 70, precioRegular: null, pago: 10, saldo: 60, numero: "74183419", estado: "PEDIDO 10", nota: "" },
  { id: 14, titulo: "CHAINSAW MAN 22", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 15, titulo: "CHAINSAW MAN 22", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 16, titulo: "CHAINSAW MAN 22", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "76192391", estado: "SEPARADO", nota: "" },
  { id: 17, titulo: "CHAINSAWMAN 18", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "PEDIDO 9", nota: "" },
  { id: 18, titulo: "CHAINSAWMAN 19", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "PEDIDO 9", nota: "" },
  { id: 19, titulo: "CHAINSAWMAN 20", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "PEDIDO 9", nota: "" },
  { id: 20, titulo: "CHOUJIN X 7", tipo: "", precioVendido: 89, precioRegular: null, pago: 0, saldo: 89, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 21, titulo: "DANDADAN 21", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 22, titulo: "DEATH NOTE 01", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 23, titulo: "DEATH NOTE 02", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 24, titulo: "DEATH NOTE 03", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 25, titulo: "DEATH NOTE 04", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 26, titulo: "DEATH NOTE 05", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 27, titulo: "DEATH NOTE 06", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 28, titulo: "DEATH NOTE 07", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "PEDIDO 9", nota: "" },
  { id: 29, titulo: "DEATH NOTE 08", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 30, titulo: "DEATH NOTE 09", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 31, titulo: "DEATH NOTE 10", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 32, titulo: "DEATH NOTE 11", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 33, titulo: "DEATH NOTE 12", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 34, titulo: "DEATH NOTE 13", tipo: "", precioVendido: 165, precioRegular: null, pago: 165, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 35, titulo: "DEATH NOTE SHORT STORIES", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "79162212", estado: "SEPARADO", nota: "" },
  { id: 36, titulo: "EL CALLEJON", tipo: "", precioVendido: 131.75, precioRegular: null, pago: 131.75, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 37, titulo: "ELLA Y SU GATO", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 76.5, saldo: 0, numero: "68837402", estado: "SEPARADO", nota: "" },
  { id: 38, titulo: "FAIRY TALE 13", tipo: "PRE VENTA", precioVendido: 67.5, precioRegular: 75, pago: 0, saldo: 67.5, numero: "77331983", estado: "", nota: "" },
  { id: 39, titulo: "FRIEREN 10", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 72.25, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 40, titulo: "FRIEREN 11", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "PEDIDO 9", nota: "" },
  { id: 41, titulo: "FRIEREN 12", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 36.5, saldo: 35.75, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 42, titulo: "FRIEREN 13", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 43, titulo: "FRIEREN 14", tipo: "", precioVendido: 72.25, precioRegular: null, pago: 0, saldo: 72.25, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 44, titulo: "GACHIAKUTA 02", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 45, titulo: "GACHIAKUTA 03", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 46, titulo: "GACHIAKUTA 04", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 47, titulo: "GACHIAKUTA 05", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 48, titulo: "GACHIAKUTA 06", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 49, titulo: "GACHIAKUTA 07", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 50, titulo: "GACHIAKUTA 08", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 51, titulo: "GACHIAKUTA 09", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 52, titulo: "GACHIAKUTA 10", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 53, titulo: "GACHIAKUTA 11", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 54, titulo: "GACHIAKUTA 12", tipo: "PRE VENTA", precioVendido: 84, precioRegular: null, pago: 0, saldo: 84, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 55, titulo: "GACHIAKUTA 12", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78059568", estado: "SEPARADO", nota: "" },
  { id: 56, titulo: "GACHIAKUTA 13", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "PEDIDO 9", nota: "" },
  { id: 57, titulo: "GACHIAKUTA 13", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "72536421", estado: "PEDIDO 9", nota: "" },
  { id: 58, titulo: "GANTZ 11", tipo: "PRE VENTA", precioVendido: 139.5, precioRegular: 205, pago: 100, saldo: 39.5, numero: "77172292", estado: "SEPARADO", nota: "" },
  { id: 59, titulo: "GANTZ 13", tipo: "", precioVendido: 132, precioRegular: null, pago: 0, saldo: 132, numero: "76192391", estado: "SEPARADO", nota: "" },
  { id: 60, titulo: "GIRLFRIEND & GIRLFRIEND 09", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "72420200", estado: "SEPARADO", nota: "" },
  { id: 61, titulo: "GRAND BLUE 9", tipo: "PRE VENTA", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 62, titulo: "HAIKYU!! #40", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 63, titulo: "HITORIJIME MY HERO 10", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 64, titulo: "HOMUNCULUS 08", tipo: "", precioVendido: 131, precioRegular: null, pago: 131, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 65, titulo: "HOMUNCULUS 09", tipo: "", precioVendido: 131, precioRegular: null, pago: 131, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 66, titulo: "HOMUNCULUS 10", tipo: "", precioVendido: 131, precioRegular: null, pago: 131, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 67, titulo: "IRUMA KUN 12", tipo: "PRE VENTA", precioVendido: 139.5, precioRegular: 230, pago: 100, saldo: 39.5, numero: "77172292", estado: "SEPARADO", nota: "" },
  { id: 68, titulo: "JACO", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "68837402", estado: "SEPARADO", nota: "" },
  { id: 69, titulo: "JOJOS BIZARRE ADVENTURE PARTE 7: STEEL BALL RUN 09", tipo: "", precioVendido: 132, precioRegular: null, pago: 132, saldo: 0, numero: "77229974", estado: "SEPARADO", nota: "" },
  { id: 70, titulo: "JUJUTSU KAISEN 30", tipo: "RESERVA", precioVendido: 125, precioRegular: null, pago: 40, saldo: 85, numero: "61871125", estado: "PEDIDO 21", nota: "" },
  { id: 71, titulo: "KAIJU Nº 8 #16", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 45, saldo: 31.5, numero: "68837402", estado: "SEPARADO", nota: "" },
  { id: 72, titulo: "KAIJU Nº 8 #16", tipo: "", precioVendido: 72, precioRegular: null, pago: 40, saldo: 32, numero: "72536421", estado: "SEPARADO", nota: "" },
  { id: 73, titulo: "KAIJU Nº 8 #16", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 74, titulo: "MUSHOKU TENSEI NOVELA 01", tipo: "PRE VENTA", precioVendido: 105, precioRegular: 105, pago: 105, saldo: 0, numero: "78448686", estado: "", nota: "" },
  { id: 75, titulo: "NIER AUTOMATA 04", tipo: "", precioVendido: 110, precioRegular: null, pago: 55, saldo: 55, numero: "78714388", estado: "PEDIDO 9", nota: "" },
  { id: 76, titulo: "ONE PIECE #104", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 77, titulo: "ONE PUNCH MAN 14", tipo: "PRE VENTA", precioVendido: 98, precioRegular: null, pago: 0, saldo: 98, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 78, titulo: "ONE PUNCH MAN 15", tipo: "PRE VENTA", precioVendido: 98, precioRegular: null, pago: 0, saldo: 98, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 79, titulo: "ONE PUNCH MAN 17", tipo: "PRE VENTA", precioVendido: 98, precioRegular: null, pago: 0, saldo: 98, numero: "78714388", estado: "PEDIDO 11", nota: "" },
  { id: 80, titulo: "OYASUMI PUN PUN 01", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "PEDIDO 9", nota: "" },
  { id: 81, titulo: "OYASUMI PUN PUN 03", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "PEDIDO 11", nota: "" },
  { id: 82, titulo: "OYASUMI PUN PUN 07", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "PEDIDO 9", nota: "" },
  { id: 83, titulo: "OYASUMI PUN PUN 13", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "SEPARADO", nota: "" },
  { id: 84, titulo: "PHANTOM BUSTERS 01", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 76.5, saldo: 0, numero: "78624158", estado: "SEPARADO", nota: "" },
  { id: 85, titulo: "REAL 8", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "SEPARADO", nota: "" },
  { id: 86, titulo: "REAL 9", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "72735364", estado: "SEPARADO", nota: "" },
  { id: 87, titulo: "REZERO 1 PARTE 1", tipo: "PRE VENTA", precioVendido: 90, precioRegular: null, pago: 0, saldo: 90, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 88, titulo: "ROOSTHER FIGHTER 08", tipo: "PRE VENTA", precioVendido: 94.5, precioRegular: null, pago: 47.25, saldo: 47.25, numero: "68727183", estado: "SEPARADO", nota: "" },
  { id: 89, titulo: "ROOSTHER FIGHTER 09", tipo: "PRE VENTA", precioVendido: 94.5, precioRegular: null, pago: 47.25, saldo: 47.25, numero: "68727183", estado: "SEPARADO", nota: "" },
  { id: 90, titulo: "SAINT SEIYA: THE LOST CANVAS #5", tipo: "", precioVendido: 132, precioRegular: null, pago: 66, saldo: 66, numero: "72536421", estado: "SEPARADO", nota: "" },
  { id: 91, titulo: "SAINT SEIYA: THE LOST CANVAS #5", tipo: "", precioVendido: 139.5, precioRegular: null, pago: 139.5, saldo: 0, numero: "79162212", estado: "PEDIDO 9", nota: "" },
  { id: 92, titulo: "SAKAMOTO DAYS 19", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 93, titulo: "SAKAMOTO DAYS 20", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78133203", estado: "PEDIDO 9", nota: "" },
  { id: 94, titulo: "SAKAMOTO DAYS 20", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "PEDIDO 9", nota: "" },
  { id: 95, titulo: "SOLO LEVELING 10", tipo: "", precioVendido: 200, precioRegular: null, pago: 50, saldo: 150, numero: "68837402", estado: "PEDIDO 9", nota: "" },
  { id: 96, titulo: "SOLO LEVELING 11", tipo: "PRE VENTA", precioVendido: 234, precioRegular: null, pago: 117, saldo: 117, numero: "68727183", estado: "SEPARADO", nota: "" },
  { id: 97, titulo: "SOLO LEVELING 12", tipo: "PRE VENTA", precioVendido: 211.5, precioRegular: null, pago: 100, saldo: 111.5, numero: "77172292", estado: "SEPARADO", nota: "" },
  { id: 98, titulo: "SOLO LEVELING 12", tipo: "PRE VENTA", precioVendido: 234, precioRegular: null, pago: 117, saldo: 117, numero: "68727183", estado: "SEPARADO", nota: "" },
  { id: 99, titulo: "SOLO LEVELING 13", tipo: "", precioVendido: 200, precioRegular: null, pago: 200, saldo: 0, numero: "77172292", estado: "SEPARADO", nota: "saldo es 165 8/1/2026" },
  { id: 100, titulo: "SOLO LEVELING 9", tipo: "", precioVendido: 200, precioRegular: null, pago: 50, saldo: 150, numero: "68837402", estado: "PEDIDO 9", nota: "" },
  { id: 101, titulo: "SPY FAMILY 16", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "PEDIDO 9", nota: "" },
  { id: 102, titulo: "TO YOUR ETERNITY 24", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 103, titulo: "TO YOUR ETERNITY 24", tipo: "", precioVendido: 72, precioRegular: null, pago: 36, saldo: 36, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 104, titulo: "TO YOUR ETERNITY 25", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 105, titulo: "TO YOUR ETERNITY 25", tipo: "", precioVendido: 72, precioRegular: null, pago: 36, saldo: 36, numero: "78714388", estado: "SEPARADO", nota: "" },
  { id: 106, titulo: "TRIGUN 02", tipo: "", precioVendido: 187, precioRegular: null, pago: 187, saldo: 0, numero: "78133203", estado: "PEDIDO 10", nota: "" },
  { id: 107, titulo: "UNDEAD UNLUCK 09", tipo: "", precioVendido: 72, precioRegular: null, pago: 0, saldo: 72, numero: "77331983", estado: "SEPARADO", nota: "" },
  { id: 108, titulo: "UZUMAKI", tipo: "", precioVendido: 170, precioRegular: null, pago: 70, saldo: 100, numero: "68837402", estado: "SEPARADO", nota: "" },
  { id: 109, titulo: "VANITAS 11", tipo: "RESERVA", precioVendido: 90, precioRegular: null, pago: 0, saldo: 90, numero: "67010106", estado: "SEPARADO", nota: "ENTRA PARA EL DESCUENTO" },
  { id: 110, titulo: "HAIKYU!! #41", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78624158", estado: "PEDIDO 11", nota: "" },
  { id: 111, titulo: "ONE PIECE 105", tipo: "", precioVendido: 72, precioRegular: null, pago: 72, saldo: 0, numero: "78624158", estado: "PEDIDO 11", nota: "" },
  { id: 112, titulo: "TU LADO OCULTO #2", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 76.5, saldo: 0, numero: "77796856", estado: "PEDIDO 11", nota: "" },
  { id: 113, titulo: "SHAMAN KING 5", tipo: "", precioVendido: 132, precioRegular: null, pago: 132, saldo: 0, numero: "78133203", estado: "PEDIDO 11", nota: "" },
  { id: 114, titulo: "ONE PIECE 105", tipo: "", precioVendido: 72, precioRegular: null, pago: 132, saldo: 72, numero: "78133203", estado: "PEDIDO 11", nota: "" },
  { id: 115, titulo: "SHUUMATSU NO VALKYRIE 23", tipo: "PRE VENTA", precioVendido: 76.5, precioRegular: 85, pago: 0, saldo: 76.5, numero: "77331983", estado: "", nota: "" },
  { id: 116, titulo: "SHUUMATSU NO VALKYRIE 24", tipo: "", precioVendido: 76.5, precioRegular: null, pago: 76.5, saldo: 0, numero: "72420200", estado: "SEPARADO", nota: "" },
  { id: 117, titulo: "SHUUMATSU NO VALKYRIE 25", tipo: "PRE VENTA", precioVendido: 76.5, precioRegular: null, pago: 0, saldo: 76.5, numero: "77331983", estado: "SEPARADO", nota: "" },
];

export function getStats(orders: Order[]) {
  const totalPedidos = orders.length;
  const totalVentas = orders.reduce((sum, o) => sum + (o.precioVendido || 0), 0);
  const totalPagado = orders.reduce((sum, o) => sum + (o.pago || 0), 0);
  const totalSaldo = orders.reduce((sum, o) => sum + (o.saldo || 0), 0);
  const pagados = orders.filter(o => o.saldo === 0 && o.precioVendido).length;
  const pendientes = orders.filter(o => (o.saldo ?? 0) > 0).length;
  
  return { totalPedidos, totalVentas, totalPagado, totalSaldo, pagados, pendientes };
}

export function getUniqueEstados(orders: Order[]): string[] {
  return [...new Set(orders.map(o => o.estado).filter(Boolean))];
}

export function getUniqueTipos(orders: Order[]): string[] {
  return [...new Set(orders.map(o => o.tipo).filter(Boolean))];
}

export function getUniqueClientes(orders: Order[]): string[] {
  return [...new Set(orders.map(o => o.numero).filter(Boolean))];
}
