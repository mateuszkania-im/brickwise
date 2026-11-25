#!/bin/bash
# Builds the data tables from pinned sources. Same inputs give byte-identical outputs.
set -euo pipefail
cd "$(dirname "$0")/../data"
RAW=raw
export LC_ALL=C
# 1. verify pinned inputs
shasum -a 256 -c SOURCES.sha256
# 2. colours: rebrickable id,name,rgb,is_trans,ldraw,bricklink,brickowl,num_sets,last_year
sqlite3 -csv "$RAW/rb.db" "select id,name,rgb,is_trans,num_sets,y2 from colors where id not in (-1,9999) order by id" > /tmp/bw_colors_rb.$$
node --input-type=module -e "
import fs from 'node:fs';
const ext = new Map(fs.readFileSync('$RAW/rb_colors_ext.raw','utf8').trim().split(';').map(r=>{const [id,ld,bl,bo]=r.split(','); return [id,{ld,bl,bo}]}));
const out=['rb_id,name,rgb,is_trans,ldraw,bricklink,brickowl,num_sets,last_year'];
for (const line of fs.readFileSync('/tmp/bw_colors_rb.$$','utf8').trim().split('\n')) {
  const m = line.match(/^(-?\d+),(\"[^\"]*\"|[^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/); if(!m) throw new Error('bad line: '+line);
  const [,id,name,rgb,tr,ns,y2]=m; const e=ext.get(id); if(!e) throw new Error('missing colour '+id+' in external id table');
  out.push([id,name,rgb,tr,e.ld,e.bl,e.bo,ns,y2].join(','));
}
if (ext.size !== out.length-1) throw new Error('colour count mismatch: '+ext.size+' vs '+(out.length-1));
fs.writeFileSync('colors.csv', out.join('\n')+'\n');"
rm -f /tmp/bw_colors_rb.$$
# 3. part+colour combinations that exist (special colours -1/9999 excluded)
{ echo "part,rb_color,num_sets,min_year,max_year"; sqlite3 -csv "$RAW/rb.db" "select part_num,color_id,num_sets,min_year,max_year from part_color_stats where color_id>=0 and color_id<9999 order by part_num,color_id"; } > part_colors.csv
# 4. part names, categories and materials
{ echo "part,name,category,material"; sqlite3 -csv "$RAW/rb.db" "select p.part_num,p.name,c.name,p.part_material from parts p join part_categories c on c.id=p.part_cat_id order by p.part_num"; } > parts.csv
# 5. relations (moulds, alternates)
{ echo "rel,child,parent"; sqlite3 -csv "$RAW/rb.db" "select rel_type,child_part_num,parent_part_num from part_rels_resolved where rel_type in ('A','M') order by rel_type,child_part_num,parent_part_num"; } > part_rels.csv
# 6. owned-set inventories: latest inventory version of every set, spares excluded (minifigure parts not included)
{ echo "set,part,rb_color,quantity"; sqlite3 -csv "$RAW/rb.db" "with latest as (select set_num, max(version) v from inventories group by set_num), inv as (select i.id, i.set_num from inventories i join latest l on l.set_num=i.set_num and l.v=i.version) select inv.set_num, ip.part_num, ip.color_id, sum(ip.quantity) from inventory_parts ip join inv on inv.id=ip.inventory_id where ip.is_spare=0 group by 1,2,3 order by 1,2,3"; } | gzip -9 -n > set_parts.csv.gz
{ echo "set,name,year,num_parts"; sqlite3 -csv "$RAW/rb.db" "select set_num,name,year,num_parts from sets order by set_num"; } > sets.csv
# 7. output manifest
shasum -a 256 colors.csv part_colors.csv parts.csv part_rels.csv set_parts.csv.gz sets.csv > OUTPUTS.sha256
cat OUTPUTS.sha256
