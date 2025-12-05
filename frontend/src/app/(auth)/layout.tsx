import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                        <Image
                            src="/assets/logo.png"
                            alt="NEO EDU Logo"
                            width={48}
                            height={48}
                            className="rounded-lg"
                            priority
                        />
                        <span className="text-2xl font-bold gradient-text">NEO EDU</span>
                    </Link>

                    {/* Form Content */}
                    {children}
                </div>
            </div>

            {/* Right Side - Decorative */}
            <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 gradient-primary opacity-90" />

                {/* Pattern Overlay */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <h2 className="text-4xl font-bold mb-4">
                        Welcome to NEO EDU
                    </h2>
                    <p className="text-lg text-white/80 mb-8">
                        Your journey to knowledge starts here. Learn at your own pace,
                        anytime and anywhere.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        {[
                            "Access courses offline",
                            "Track your learning progress",
                            "Interactive quizzes and exercises",
                            "Certificates upon completion",
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
