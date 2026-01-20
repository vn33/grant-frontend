import { useState } from "react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramCard } from "@/components/program-card";
import { PROGRAMS } from "@/lib/data";
import { Search } from "lucide-react";

export default function Programs() {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  const filteredPrograms = PROGRAMS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === "all" || p.level.toLowerCase() === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-slate-900">Funding Programs Directory</h1>
            <p className="text-slate-600">Browse the complete list of digital transformation grants, loans, and tax credits available in Québec.</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-8 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search programs..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="provincial">Provincial</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map(program => (
              <ProgramCard key={program.id} program={program} />
            ))}
            
            {filteredPrograms.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No programs found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
