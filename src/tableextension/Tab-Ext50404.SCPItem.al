tableextension 50404 "SCP Item" extends Item
{
    fields
    {
        field(50000; "SCP Is GCI Mand"; Boolean)
        {
            Caption = 'SCP Is GCI Mand';
            DataClassification = ToBeClassified;
        }
        field(50001; "Web Item"; Boolean)
        {
            Caption = 'Web Item';
            DataClassification = ToBeClassified;
        }
        field(50002; "Show Price"; Boolean)
        {
            Caption = 'Show Price';
            DataClassification = ToBeClassified;
        }
        field(50003; "Description 3"; Text[2048])
        {
            Caption = 'Description 3';
            DataClassification = ToBeClassified;
        }
    }
}
