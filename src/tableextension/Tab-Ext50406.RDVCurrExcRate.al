tableextension 50406 "RDV Curr Exc Rate" extends "Currency Exchange Rate"
{
    fields
    {
        field(50000; "Spot Exchange Rate"; Decimal)
        {

            Caption = 'Spot Exchange Rate';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(50001; "Spot Rel Exch. Rate Amount"; Decimal)
        {
            Caption = 'Spot Rel Exch. Rate Amount';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
    }
}
