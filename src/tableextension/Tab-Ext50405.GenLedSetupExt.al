tableextension 50405 "Gen Led Setup Ext" extends "General Ledger Setup"
{
    fields
    {
        field(50400; "Inventory Exchange Adjustment"; Code[20])
        {
            Caption = 'Inventory Exchange Adjustment';
            DataClassification = ToBeClassified;
            TableRelation = "G/L Account"."No.";
        }
        field(50401; "Inventory Exchange Gain/Loss"; Code[20])
        {
            Caption = 'Inventory Exchange Gain/Loss';
            DataClassification = ToBeClassified;
            TableRelation = "G/L Account"."No.";
        }
        field(50402; "COGS Exchange Adjustment"; Code[20])
        {
            Caption = 'COGS Exchange Adjustment';
            DataClassification = ToBeClassified;
            TableRelation = "G/L Account"."No.";
        }
        field(50403; "COGS Exchange Gain/Loss"; Code[20])
        {
            Caption = 'COGS Exchange Gain/Loss';
            DataClassification = ToBeClassified;
            TableRelation = "G/L Account"."No.";
        }
        field(50404; "RDV Inv Prov Exp"; Code[20])
        {
            Caption = 'Inv Province Expense';
            DataClassification = SystemMetadata;
            TableRelation = "G/L Account"."No.";
        }
        field(50405; "RDV Inv Allowance"; Code[20])
        {
            Caption = 'Inventory Allowance';
            DataClassification = SystemMetadata;
            TableRelation = "G/L Account"."No.";
        }
    }
}
