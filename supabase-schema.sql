-- สร้างตารางสำหรับเก็บข้อมูล License ของลูกค้า (ใช้ IF NOT EXISTS เพื่อความปลอดภัย)
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY, -- รหัสอัตโนมัติสำหรับแต่ละ License
    machine_id TEXT UNIQUE NOT NULL, -- รหัสเครื่องของลูกค้า (ไม่ซ้ำกัน)
    license_key TEXT UNIQUE NOT NULL, -- License Key ที่เราให้ลูกค้า
    discord_id TEXT, -- Discord ID ของลูกค้า (เช่น 123456789012345678)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')), -- สถานะของ License
    created_at TIMESTAMPTZ DEFAULT NOW(), -- วันที่สร้าง License
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'), -- วันหมดอายุ (1 เดือน)
    last_heartbeat TIMESTAMPTZ, -- ครั้งสุดท้ายที่ส่ง heartbeat
    heartbeat_count INTEGER DEFAULT 0, -- จำนวนครั้งที่ส่ง heartbeat
    notes TEXT -- หมายเหตุเพิ่มเติม (เช่น Discord username)
);

-- สร้าง Index เพื่อให้การค้นหาเร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_discord_id ON licenses(discord_id);

-- สร้าง Function สำหรับตรวจสอบว่า License หมดอายุหรือยัง
CREATE OR REPLACE FUNCTION check_license_expired()
RETURNS TRIGGER AS $$
BEGIN
    -- ถ้าวันปัจจุบันเกินวันหมดอายุ ให้เปลี่ยนสถานะเป็น expired
    IF NEW.expires_at < NOW() THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Trigger ที่จะรันทุกครั้งที่มีการ UPDATE ตาราง licenses
DROP TRIGGER IF EXISTS trigger_check_expired ON licenses;
CREATE TRIGGER trigger_check_expired
    BEFORE UPDATE ON licenses
    FOR EACH ROW
    EXECUTE FUNCTION check_license_expired();

-- สร้าง Function สำหรับอัปเดต heartbeat
CREATE OR REPLACE FUNCTION update_heartbeat(
    p_license_key TEXT,
    p_machine_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    license_exists BOOLEAN;
BEGIN
    -- ตรวจสอบว่า license อยู่และ active หรือไม่
    SELECT EXISTS(
        SELECT 1 FROM licenses 
        WHERE license_key = p_license_key 
        AND machine_id = p_machine_id 
        AND status = 'active'
        AND expires_at > NOW()
    ) INTO license_exists;
    
    IF license_exists THEN
        -- อัปเดต heartbeat
        UPDATE licenses 
        SET 
            last_heartbeat = NOW(),
            heartbeat_count = heartbeat_count + 1
        WHERE license_key = p_license_key;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Function สำหรับสร้าง license ใหม่
CREATE OR REPLACE FUNCTION create_license(
    p_machine_id TEXT,
    p_discord_id TEXT DEFAULT NULL,
    p_duration_months INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    new_license_key TEXT;
    expires_date TIMESTAMPTZ;
BEGIN
    -- ตรวจสอบว่า machine_id นี้มี license active อยู่หรือไม่
    IF EXISTS(SELECT 1 FROM licenses WHERE machine_id = p_machine_id AND status = 'active') THEN
        RAISE EXCEPTION 'Machine already has an active license';
    END IF;
    
    -- สร้าง license key ใหม่ (SHA-256 hash)
    new_license_key := encode(sha256(p_machine_id || extract(epoch from now())::text || random()::text), 'hex');
    new_license_key := upper(substring(new_license_key from 1 for 32));
    
    -- คำนวณวันหมดอายุ
    expires_date := NOW() + (p_duration_months || ' months')::INTERVAL;
    
    -- เพิ่ม license ใหม่
    INSERT INTO licenses (
        machine_id, 
        license_key, 
        discord_id, 
        expires_at, 
        notes
    ) VALUES (
        p_machine_id, 
        new_license_key, 
        p_discord_id, 
        expires_date, 
        p_notes
    );
    
    RETURN new_license_key;
END;
$$ LANGUAGE plpgsql;

-- เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ (คุณสามารถลบได้หลังจากทดสอบเสร็จ)
INSERT INTO licenses (machine_id, license_key, discord_id, notes) VALUES 
('test-machine-123', 'WC-TEST-2025-ABCD1234', '123456789012345678', 'ข้อมูลทดสอบระบบ - ลบได้'),
('demo-machine-456', 'WC-DEMO-2025-EFGH5678', '876543210987654321', 'เครื่องทดสอบ Demo')
ON CONFLICT (machine_id) DO NOTHING; -- ไม่เพิ่มถ้ามีอยู่แล้ว

-- ดูข้อมูลที่เพิ่งสร้าง
SELECT * FROM licenses;
