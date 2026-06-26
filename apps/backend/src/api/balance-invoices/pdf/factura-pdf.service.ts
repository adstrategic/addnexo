// import { TDocumentDefinitions } from "pdfmake/interfaces";
// import PdfPrinter from "pdfmake";
// import { getFacturaBySecuencia } from "../factura.service";
// import fs from "fs";
// import path from "path";

// // Initialize pdfmake with default fonts (Roboto)
// // For production, you may want to add custom fonts
// const fonts = {
//   Roboto: {
//     normal: "Helvetica",
//     bold: "Helvetica-Bold",
//     italics: "Helvetica-Oblique",
//     bolditalics: "Helvetica-BoldOblique",
//   },
// };

// const printer = new PdfPrinter(fonts);

// /**
//  * Formats a date to M/D/YYYY format
//  */
// function formatDate(date: Date | string): string {
//   const d = typeof date === "string" ? new Date(date) : date;
//   const month = d.getMonth() + 1;
//   const day = d.getDate();
//   const year = d.getFullYear();
//   return `${month}/${day}/${year}`;
// }

// /**
//  * Generates a PDF for a dispatch order
//  * @param secuencia - The organization sequence number of the dispatch order
//  * @param organizationId - The organization ID
//  * @returns PDF buffer
//  */
// export async function generateDispatchOrderPDF(
//   secuencia: number,
//   organizationId: string
// ): Promise<Buffer> {
//   // Fetch dispatch order with all required relations
//   const dispatchOrder = await getDispatchOrderBySecuencia(
//     secuencia,
//     organizationId
//   );

//   if (!dispatchOrder) {
//     throw new Error("Dispatch order not found");
//   }

//   // Validate that dispatch order has items
//   if (
//     !dispatchOrder.dispatchOrderU ||
//     dispatchOrder.dispatchOrderU.length === 0
//   ) {
//     throw new Error("Dispatch order has no items");
//   }

//   // Format issue date
//   const issueDate = formatDate(dispatchOrder.DOGFechaCreado);

//   // Build pick-up address
//   const pickUpAddress = dispatchOrder.DOGDireccionEntrega || "";
//   const cityInfo = `${dispatchOrder.ciudad.nombre}, ${dispatchOrder.ciudad.estado.nombre}, ${dispatchOrder.ciudad.estado.pais.nombre}`;

//   // Build product table rows
//   const tableBody = dispatchOrder.dispatchOrderU.map((item) => [
//     `\n${item.invcaruni?.CKDescripcion || "N/A"}\n\n`,
//     {
//       text: `\n${item.DOULote?.toString() || "N/A"}\n\n`,
//       alignment: "right" as const,
//     },
//     {
//       text: `\n${item.DOUCantidad.toString()}\n\n`,
//       alignment: "right" as const,
//     },
//   ]);

//   // Calculate total quantity
//   const totalQuantity = dispatchOrder.dispatchOrderU.reduce(
//     (sum, item) => sum + Number(item.DOUCantidad),
//     0
//   );

//   // Total row
//   const totalRow: any[] = [
//     {
//       text: "\nTotal\n\n",
//       bold: true,
//       // margin: [0, 8, 0, 8],
//     },
//     {
//       text: "\n\n\n",
//       alignment: "right",
//       // margin: [0, 8, 0, 8],
//     },
//     {
//       text: `\n${totalQuantity.toString()}\n\n`,
//       bold: true,
//       alignment: "right",
//       // margin: [0, 8, 0, 8],
//     },
//   ];

//   // 🚀 Ruta absoluta del logo
//   const logoPath = path.join(__dirname, "../../../assets/logo-cima.png");

//   // 🚀 Convertir logo a base64
//   const logoBase64 = fs.readFileSync(logoPath).toString("base64");
//   const logoDataUrl = `data:image/png;base64,${logoBase64}`;

//   // PDF document definition
//   const docDefinition: TDocumentDefinitions = {
//     pageSize: "LETTER",
//     pageMargins: [40, 60, 40, 60],
//     content: [
//       // Header Section with Logo
//       {
//         columnGap: 50,
//         columns: [
//           // Logo on the left
//           {
//             image: logoDataUrl,
//             width: 150,
//             margin: [0, 0, 100, 0],
//           },
//           // Dispatch order details on the right
//           {
//             stack: [
//               {
//                 text: `DISPATCH ORDER No ${dispatchOrder.DOGNro}`,
//                 fontSize: 20,
//                 bold: true,
//                 marginBottom: 5,
//               },
//               ...(dispatchOrder.DOGPurchaseOrderId
//                 ? [
//                     {
//                       text: `Ref: PO ${dispatchOrder.DOGPurchaseOrderId}`,
//                       fontSize: 14,
//                       bold: true,
//                       marginBottom: 5,
//                     },
//                   ]
//                 : []),
//               {
//                 text: `Issue Date: ${issueDate}`,
//                 fontSize: 12,
//                 bold: false,
//               },
//             ],
//           },
//         ],
//         marginBottom: 30,
//       },
//       // Pick-up Information
//       {
//         text: "Pick up information:",
//         fontSize: 12,
//         bold: true,
//         marginBottom: 5,
//       },
//       {
//         text: pickUpAddress || "N/A",
//         fontSize: 11,
//         marginBottom: 5,
//       },
//       ...(cityInfo
//         ? [
//             {
//               text: cityInfo,
//               fontSize: 11,
//               marginBottom: 30,
//             },
//           ]
//         : [
//             {
//               text: "",
//               marginBottom: 30,
//             },
//           ]),
//       // Product Table
//       {
//         // layout: "lightHorizontalLines",
//         table: {
//           headerRows: 1,
//           widths: ["*", 50, 50],

//           body: [
//             // Header row
//             [
//               {
//                 text: "Product",
//                 style: "tableHeader",
//                 bold: true,
//                 fillColor: "#E5E5E5",
//                 alignment: "center",
//                 margin: [0, 10, 0, 10],
//               },
//               {
//                 text: "Lot",
//                 style: "tableHeader",
//                 bold: true,
//                 fillColor: "#E5E5E5",
//                 alignment: "center",
//                 margin: [0, 10, 0, 10],
//               },
//               {
//                 text: "Quantity",
//                 style: "tableHeader",
//                 bold: true,
//                 fillColor: "#E5E5E5",
//                 // alignment: "center",
//                 margin: [0, 10, 0, 10],
//               },
//             ],
//             // Data rows
//             ...tableBody,
//             // Total row
//             totalRow,
//           ],
//         },
//         marginBottom: 30,
//       },
//       // Note Section
//       {
//         text: "I confirm that all the products received are in good order and conditions.",
//         fontSize: 11,
//         marginBottom: 60,
//       },
//       // Signature Section with Receiver and Vendor
//       {
//         columns: [
//           // Left column: Receiver's Signature
//           {
//             width: "*",
//             stack: [
//               {
//                 canvas: [
//                   {
//                     type: "line",
//                     x1: 0,
//                     y1: 0,
//                     x2: 300,
//                     y2: 0,
//                     lineWidth: 1,
//                     dash: { length: 5, space: 5 },
//                   },
//                 ],
//                 marginBottom: 5,
//               },
//               {
//                 text: "Receiver's Signature",
//                 fontSize: 11,
//                 alignment: "left",
//               },
//             ],
//           },
//         ],
//         marginBottom: 50,
//       },
//       {
//         columns: [
//           // Left column: Receiver's Signature
//           {
//             width: "auto",
//             // Right column: Vendor
//             stack: [
//               {
//                 text: "Vendor:",
//                 fontSize: 11,
//                 bold: true,
//                 alignment: "left",
//                 marginBottom: 5,
//               },
//               {
//                 text: dispatchOrder.vendedor?.VNombre || "N/A",
//                 fontSize: 11,
//                 alignment: "left",
//               },
//             ],
//           },
//         ],
//         marginBottom: 10,
//       },
//       // Footer - PACA terms (placeholder text, should be provided by user)
//       {
//         text: "PACA TERMS APPLY. CIMA PRODUCE INC. Interest at 1.5% per month added to unpaid balance. Interest and attorney’s fees necessary to collect any balance due hereunder shall be considered sums owing in connection with this transaction under the PACA trust. The perishable agricultural commodities listed on this invoice are sold subject to the statutory trust authorized by Section 5 (c) of the Perishable Agricultural Commodities Act, 1930 (7 U.S.C 499e(c)). The seller of these commodities retains a trust claim over these commodities, all inventories of food or other products derived from these commodities, and any receivables or proceeds from the sale of these commodities until full payment is received. All transactions are condition only, no grade contracts and PACA good delivery standards apply, unless a grade is specifically stated. No claims will be honored unless the Buyer notifies Cima Produce Inc. of the claim no later than 24 hours after arrival. All prices are subject to change and availability. All produce is sold FOB Good Delivery.",
//         fontSize: 8,
//         alignment: "left",
//         margin: [0, 50, 0, 0],
//         color: "#666666",
//       },
//     ],
//     styles: {
//       tableHeader: {
//         fontSize: 11,
//         bold: true,
//       },
//     },
//     defaultStyle: {
//       font: "Roboto",
//       fontSize: 11,
//     },
//   };

//   // Generate PDF
//   const pdfDoc = printer.createPdfKitDocument(docDefinition);

//   // Convert to buffer
//   return new Promise<Buffer>((resolve, reject) => {
//     const chunks: Uint8Array[] = [];
//     pdfDoc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
//     pdfDoc.on("end", () => {
//       const buffer = Buffer.concat(chunks);
//       resolve(buffer);
//     });
//     pdfDoc.on("error", (error: Error) => {
//       reject(error);
//     });
//     pdfDoc.end();
//   });
// }
