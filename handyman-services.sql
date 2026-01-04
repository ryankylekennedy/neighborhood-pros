-- Handyman Services
-- Subcategory ID: 81141234-3385-4c15-8ceb-1eaa9e9b8644

-- REPAIR SERVICES
INSERT INTO public.services (name, subcategory_id) VALUES
('Drywall Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Door Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Window Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Cabinet Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Fence Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Deck Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Furniture Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Appliance Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Screen Door Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Garage Door Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- INSTALLATION SERVICES
INSERT INTO public.services (name, subcategory_id) VALUES
('Shelf Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('TV Mounting', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Ceiling Fan Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Light Fixture Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Curtain Rod Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Towel Bar Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Mirror Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Mailbox Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Door Handle Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Cabinet Hardware Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Smoke Detector Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Security Camera Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Doorbell Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Smart Home Device Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- PAINTING & FINISHING
INSERT INTO public.services (name, subcategory_id) VALUES
('Interior Painting', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Touch-up Painting', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Trim Painting', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Caulking', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Staining', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Wood Finishing', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- CARPENTRY
INSERT INTO public.services (name, subcategory_id) VALUES
('Custom Shelving', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Baseboard Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Crown Molding Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Door Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Trim Work', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Wood Rot Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Custom Built-ins', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- FLOORING
INSERT INTO public.services (name, subcategory_id) VALUES
('Floor Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Tile Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Laminate Flooring Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Vinyl Flooring Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Baseboard Replacement', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- PLUMBING (Minor)
INSERT INTO public.services (name, subcategory_id) VALUES
('Faucet Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Faucet Replacement', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Toilet Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Leaky Pipe Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Drain Cleaning', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Garbage Disposal Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Showerhead Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- ELECTRICAL (Minor)
INSERT INTO public.services (name, subcategory_id) VALUES
('Outlet Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Switch Replacement', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('GFCI Outlet Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Dimmer Switch Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- ASSEMBLY
INSERT INTO public.services (name, subcategory_id) VALUES
('Furniture Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('IKEA Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Desk Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Bed Frame Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Bookshelf Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Exercise Equipment Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Grill Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Playground Equipment Assembly', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- OUTDOOR
INSERT INTO public.services (name, subcategory_id) VALUES
('Gutter Cleaning', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Gutter Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Power Washing', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Deck Staining', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Deck Cleaning', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Fence Staining', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Outdoor Lighting Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Hose Bib Repair', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;

-- MISCELLANEOUS
INSERT INTO public.services (name, subcategory_id) VALUES
('Picture Hanging', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Childproofing', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Pet Door Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Grab Bar Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Weatherstripping', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Attic Ladder Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Closet Organization Installation', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Home Safety Inspection', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('General Handyman Services', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Small Home Repairs', '81141234-3385-4c15-8ceb-1eaa9e9b8644'),
('Honey-Do List Services', '81141234-3385-4c15-8ceb-1eaa9e9b8644')
ON CONFLICT (name, subcategory_id) DO NOTHING;
