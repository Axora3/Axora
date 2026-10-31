import { LibraryDetail } from "@/components/content/LibraryPages";
export default function Page({ params }: { params: Promise<{slug:string}> }) { return <LibraryDetail kind="blog" params={params}/>; }
