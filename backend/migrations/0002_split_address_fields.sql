-- Split address into more detailed fields
ALTER TABLE users ADD COLUMN house_no TEXT;
ALTER TABLE users ADD COLUMN area TEXT;
ALTER TABLE users ADD COLUMN address_label TEXT DEFAULT 'Home';
