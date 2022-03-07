pageextension 50405 "RDV Curr Exchange Rate" extends "Currency Exchange Rates"
{
    layout
    {
        addafter("Relational Exch. Rate Amount")
        {
            field("Spot Exchange Rate"; Rec."Spot Exchange Rate")
            {
                ApplicationArea = All;
            }
            field("Spot Rel Exch. Rate Amount"; Rec."Spot Rel Exch. Rate Amount")
            {
                ApplicationArea = All;
            }
        }
    }
}
