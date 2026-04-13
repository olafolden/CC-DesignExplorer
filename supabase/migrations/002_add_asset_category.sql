-- Add category column for multi-model-per-design support
-- Allows design_0_massing.glb and design_0_daylight.glb naming pattern

-- Add category column with safe default for existing rows
ALTER TABLE assets ADD COLUMN category text NOT NULL DEFAULT 'default';

-- Drop old unique constraint (one model per design per asset_type)
ALTER TABLE assets DROP CONSTRAINT assets_design_id_asset_type_key;

-- New constraint: one asset per design per type per category
ALTER TABLE assets ADD CONSTRAINT assets_design_id_type_category_key
  UNIQUE(design_id, asset_type, category);
