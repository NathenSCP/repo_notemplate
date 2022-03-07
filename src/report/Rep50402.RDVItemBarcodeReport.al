report 50402 "RDV ItemBarcodeReport"
{
    UsageCategory = Administration;
    ApplicationArea = All;
    DefaultLayout = RDLC;
    Caption = 'Item Barcodes';
    RDLCLayout = './layout-rdlc/Rep50402.RDVItemBarcodes.rdlc';

    dataset
    {
        dataitem(Items; "Item Purchase Detail")
        {
            // DataItemTableView = SORTING("Entry No.");
            // RequestFilterFields = "Item No.";
            //RequestFilterHeading = 'Items';

            column(No_; "Item No.")
            {
            }
            column(Description; "Item Description")
            {

            }
            column(Item_Cat; "Item Cat")
            {

            }

            column(Unit_Price; "Item Price")
            {
                AutoFormatType = 10;
                AutoFormatExpression = '$<precision, 2:2><standard format, 0>';
            }

            column(Barcode; EncodedText)
            {
            }
            column(PriceDiscountCode; "Price Discount Code")
            {
            }
            column(SerialNo; "Serial No.")
            {
            }

            trigger OnAfterGetRecord()
            var

                BarcodeSymbology: Enum "Barcode Symbology";
                BarcodeFontProvider: Interface "Barcode Font Provider";                       //BARCODE SIMBOLOGY DECLARATION
                BarcodeStr: Code[20];

            begin

                BarcodeFontProvider := Enum::"Barcode Font Provider"::IDAutomation1D;         //FONT PROVIDER IDAUTOMATION
                BarcodeSymbology := Enum::"Barcode Symbology"::Code128;                        //SIMBOLOGY - "CODE 39" in this case
                BarcodeStr := "Serial No.";
                BarcodeFontProvider.ValidateInput(BarcodeStr, BarcodeSymbology);              //VALIDATE INPUT DATA - NOT MANDATORY
                EncodedText := BarcodeFontProvider.EncodeFont(BarcodeStr, BarcodeSymbology);  //ENCODETEXT in Barcode  

                If Text.StrLen("Item Description") > 20 then
                    "Item Description" := "Item Description".Substring(1, 20);
            end;
        }
    }

    var
        EncodedText: Text;
}