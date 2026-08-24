"use strict";

/* =========================================================
   SUBSENTRY DASHBOARD MENU
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        const menuButton =
            document.getElementById(
                "dashboardMenuButton"
            );

        const dropdown =
            document.getElementById(
                "dashboardMenuDropdown"
            );

        const menuInitial =
            document.getElementById(
                "menuUserInitial"
            );

        const menuName =
            document.getElementById(
                "menuUserName"
            );

        const menuEmail =
            document.getElementById(
                "menuUserEmail"
            );

        const welcomeUser =
            document.getElementById(
                "welcomeUser"
            );


        if(
            !menuButton ||
            !dropdown
        ){
            return;
        }


        /* =====================================================
           OPEN / CLOSE
        ===================================================== */

        function openMenu(){

            dropdown.classList.add(
                "open"
            );

            menuButton.classList.add(
                "active"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );

            dropdown.setAttribute(
                "aria-hidden",
                "false"
            );
        }


        function closeMenu(){

            dropdown.classList.remove(
                "open"
            );

            menuButton.classList.remove(
                "active"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            dropdown.setAttribute(
                "aria-hidden",
                "true"
            );
        }


        function toggleMenu(){

            if(
                dropdown.classList.contains(
                    "open"
                )
            ){

                closeMenu();

            }else{

                openMenu();
            }
        }


        menuButton.addEventListener(
            "click",
            function(event){

                event.stopPropagation();

                toggleMenu();
            }
        );


        /* =====================================================
           CLICK OUTSIDE
        ===================================================== */

        document.addEventListener(
            "click",
            function(event){

                if(
                    !dropdown.contains(
                        event.target
                    ) &&
                    !menuButton.contains(
                        event.target
                    )
                ){

                    closeMenu();
                }
            }
        );


        /* =====================================================
           ESCAPE KEY
        ===================================================== */

        document.addEventListener(
            "keydown",
            function(event){

                if(
                    event.key === "Escape"
                ){

                    closeMenu();

                    menuButton.focus();
                }
            }
        );


        /* =====================================================
           UPDATE USER INFO
        ===================================================== */

        function updateMenuUser(){

            if(
                typeof currentUser ===
                "undefined" ||
                !currentUser
            ){

                return;
            }


            const name =
                currentUser.name ||
                "User";

            const email =
                currentUser.email ||
                "SubSentry account";


            if(menuName){

                menuName.textContent =
                    name;
            }


            if(menuEmail){

                menuEmail.textContent =
                    email;
            }


            if(menuInitial){

                menuInitial.textContent =
                    name
                        .trim()
                        .charAt(0)
                        .toUpperCase();
            }


            if(welcomeUser){

                welcomeUser.textContent =
                    `Welcome, ${name}`;
            }
        }


        /*
         * script.js initializes the current user.
         * Run once now and once shortly after initialization
         * so the menu always receives the correct account.
         */

        updateMenuUser();


        setTimeout(
            updateMenuUser,
            100
        );


        setTimeout(
            updateMenuUser,
            400
        );


        /* =====================================================
           CLOSE MENU AFTER ACTION
        ===================================================== */

        const actionButtons =
            dropdown.querySelectorAll(
                ".menu-action"
            );


        actionButtons.forEach(
            function(button){

                button.addEventListener(
                    "click",
                    function(){

                        /*
                         * Give the original SubSentry
                         * event listener time to execute.
                         */

                        setTimeout(
                            closeMenu,
                            100
                        );
                    }
                );
            }
        );

    }
);