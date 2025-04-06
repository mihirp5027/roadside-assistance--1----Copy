import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Define the user type
type CustomUser = {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  token: string;
  role: string;
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: CustomUser;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    user?: CustomUser;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return {
              id: user._id,
              name: user.name,
              email: user.email,
              token: user.token,
              role: user.role
            } satisfies CustomUser;
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as unknown as CustomUser;
        token.accessToken = customUser.token;
        token.user = {
          id: customUser.id,
          name: customUser.name,
          email: customUser.email,
          token: customUser.token,
          role: customUser.role
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user = token.user || {
          id: "",
          name: null,
          email: null,
          token: "",
          role: ""
        };
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST }; 