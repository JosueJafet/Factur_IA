import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.contrasena) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { correo: credentials.correo as string },
        });

        if (!usuario || usuario.estado === "Inactivo") return null;

        const passwordOk = await bcrypt.compare(
          credentials.contrasena as string,
          usuario.contrasena
        );

        if (!passwordOk) return null;

        return {
          id: String(usuario.id_usuario),
          name: usuario.nombre,
          email: usuario.correo,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/auth/login" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string;
      return session;
    },
  },
});