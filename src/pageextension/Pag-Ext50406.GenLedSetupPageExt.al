pageextension 50406 "Gen Led Setup Page Ext" extends "General Ledger Setup"
{
    layout
    {
        addlast(Application)
        {
            field("Inventory Exchange Adjustment"; Rec."Inventory Exchange Adjustment")
            {
                ApplicationArea = All;
            }
            field("Inventory Exchange Gain/Loss"; Rec."Inventory Exchange Gain/Loss")
            {
                ApplicationArea = All;
            }
            field("COGS Exchange Adjustment"; Rec."COGS Exchange Adjustment")
            {
                ApplicationArea = All;
            }
            field("COGS Exchange Gain/Loss"; Rec."COGS Exchange Gain/Loss")
            {
                ApplicationArea = All;
            }
            field("RDV Inv Prov Exp"; Rec."RDV Inv Prov Exp")
            {
                ApplicationArea = All;
                Caption = 'Inventory Provision Expense';
            }
            field("RDV Inv Allowance"; Rec."RDV Inv Allowance")
            {
                ApplicationArea = All;
                Caption = 'Inventory Allowance';
            }

        }
    }
}
