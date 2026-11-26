-- Preserve actionable publish validation instead of treating scalar text as an array literal.
create or replace function public.guard_template_publish()
returns trigger language plpgsql security definer set search_path='' as $$
declare missing text[]:='{}';
begin
 if new.status<>'published' or new.is_demo then return new;end if;
 if char_length(btrim(new.title))=0 then missing:=array_append(missing,'title');end if;
 if char_length(btrim(new.slug))=0 then missing:=array_append(missing,'slug');end if;
 if char_length(btrim(new.short_description))=0 then missing:=array_append(missing,'short_description');end if;
 if(new.is_free and new.price<>0)or(not new.is_free and new.price<=0)then missing:=array_append(missing,'price');end if;
 if not new.is_free and not exists(select 1 from public.template_files where template_id=new.id and(storage_path is not null or external_url is not null))then missing:=array_append(missing,'file');end if;
 if array_length(missing,1)>0 then raise exception using errcode='P0001',message='publish_requirements',detail=array_to_string(missing,',');end if;
 return new;
end $$;
