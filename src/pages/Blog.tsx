import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image_url, published_at, created_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-6 pb-16 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-2 font-display text-4xl font-bold text-foreground md:text-5xl">
            Blog <span className="text-gradient-gold">Élite</span>
          </h1>
          <p className="mb-12 font-body text-lg text-muted-foreground">
            Insights e tendências do mercado imobiliário de alto padrão.
          </p>
        </motion.div>

        {loading ? (
          <p className="font-body text-muted-foreground">Carregando artigos...</p>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-display text-2xl text-foreground">Nenhum artigo publicado ainda</p>
            <p className="mt-2 font-body text-muted-foreground">Volte em breve para novidades!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block overflow-hidden border border-border bg-card transition-all hover:border-primary/30 hover:shadow-[var(--shadow-gold)]"
                >
                  {post.cover_image_url && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="font-body text-xs">
                        {new Date(post.published_at || post.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <h2 className="mb-2 font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mb-3 line-clamp-2 font-body text-sm text-muted-foreground">{post.excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-wider text-primary">
                      Ler mais <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
