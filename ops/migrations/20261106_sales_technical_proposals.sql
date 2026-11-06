CREATE TABLE IF NOT EXISTS sales_technical_proposals (
    id uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES sales_accounts(id),
    opportunity_id uuid NULL REFERENCES sales_opportunities(id),
    source_conversation_id uuid NULL,
    version integer NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'draft',
    title varchar(255) NOT NULL,
    scope_text text NOT NULL,
    methodology_text text NULL,
    deliverables_text text NULL,
    assumptions_text text NULL,
    exclusions_text text NULL,
    timeline_text text NULL,
    notes text NULL,
    created_by varchar(128) NOT NULL DEFAULT 'ceo_execution_engine',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_technical_proposals_account_version UNIQUE (account_id, version)
);
CREATE INDEX IF NOT EXISTS ix_sales_technical_proposals_account ON sales_technical_proposals(account_id);
CREATE INDEX IF NOT EXISTS ix_sales_technical_proposals_opportunity ON sales_technical_proposals(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_sales_technical_proposals_status ON sales_technical_proposals(status);
