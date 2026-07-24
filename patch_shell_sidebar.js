const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

// 1. Add ChevronDown to lucide-react imports
code = code.replace(
  /Printer,?\n\} from "lucide-react";/,
  `Printer,\n  ChevronDown,\n} from "lucide-react";`
);

// 2. Add expandedCategories state and logic to Shell component
const stateLogic = `  const [activeTab, setActiveTab] = useState<TabId>("beranda");
  const { state, logout, isAdmin } = useStore();
  const [isOnline, setIsOnline] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Expand category that contains the active tab
    const activeCat = MENU_CATEGORIES.find(c => c.items.some(i => i.id === activeTab))?.category;
    if (activeCat && !expandedCategories[activeCat]) {
      setExpandedCategories(prev => ({ ...prev, [activeCat]: true }));
    }
  }, [activeTab]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };`;
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<TabId>\("beranda"\);\n  const \{ state, logout, isAdmin \} = useStore\(\);\n  const \[isOnline, setIsOnline\] = useState\(true\);/,
  stateLogic
);

// 3. Replace the nav rendering logic
const oldNav = `<nav className="flex-1 py-2 overflow-y-auto no-scrollbar">
          {MENU_CATEGORIES.map((category) => {
            const filteredItems = category.items.filter(item => !item.adminOnly || isAdmin);
            if (filteredItems.length === 0) return null;
            return (
            <div key={category.category} className="mb-4">
              <div className="px-6 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {category.category}
              </div>
              <div className="space-y-0.5">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "sidebar-item flex items-center w-full px-6 py-2.5 text-sm font-medium",
                      activeTab === item.id ? "sidebar-active" : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ); 
          })}
        </nav>`;

const newNav = `<nav className="flex-1 py-2 overflow-y-auto no-scrollbar">
          {MENU_CATEGORIES.map((category) => {
            const filteredItems = category.items.filter(item => !item.adminOnly || isAdmin);
            if (filteredItems.length === 0) return null;

            if (category.category === "Menu Utama") {
              return (
                <div key={category.category} className="mb-2">
                  <div className="px-6 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {category.category}
                  </div>
                  <div className="space-y-0.5">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "sidebar-item flex items-center w-full px-6 py-2.5 text-sm font-medium",
                          activeTab === item.id ? "sidebar-active" : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            const isExpanded = expandedCategories[category.category];

            return (
              <div key={category.category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="flex items-center justify-between w-full px-6 py-2 text-[10px] font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors outline-none cursor-pointer"
                >
                  <span>{category.category}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-300", isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden">
                    <div className="space-y-0.5">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "sidebar-item flex items-center w-full px-6 py-2.5 text-sm font-medium pl-10",
                            activeTab === item.id ? "sidebar-active" : "text-gray-600 hover:bg-gray-50",
                          )}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>`;

code = code.replace(oldNav, newNav);

fs.writeFileSync('components/Shell.tsx', code);
